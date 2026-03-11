import Anthropic from '@anthropic-ai/sdk'
import { Langfuse } from 'langfuse'
import { waitUntil } from '@vercel/functions'
import SYSTEM_PROMPT from '../chatbot-prompt.txt'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ---------------------------------------------------------------------------
// RAG: tool definition for Agentic RAG
// ---------------------------------------------------------------------------

function isRagEnabled() {
  return !!(process.env.OPENAI_API_KEY && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const PORTFOLIO_TOOL = {
  name: 'search_portfolio',
  description: "Search Santiago's published articles for project details. The system prompt only has brief summaries — this tool has the FULL content: architectures, sub-agents, workflows, Airtable structures, metrics, technical decisions, pipeline details, code patterns, and lessons learned. Use this whenever the user asks for specifics about any project.",
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant portfolio content',
      },
    },
    required: ['query'],
  },
}

// ---------------------------------------------------------------------------
// RAG: embed query via OpenAI REST API (Edge-compatible)
// ---------------------------------------------------------------------------

async function embedQuery(query) {
  const t0 = Date.now()
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    embedding: data.data[0].embedding,
    latencyMs: Date.now() - t0,
  }
}

// ---------------------------------------------------------------------------
// RAG: hybrid search via Supabase RPC (Edge-compatible)
// ---------------------------------------------------------------------------

async function searchDocuments(queryText, queryEmbedding) {
  const t0 = Date.now()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000) // 2s timeout (cold start can be slow)

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/hybrid_search`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: queryText,
          query_embedding: queryEmbedding,
          match_count: 10,
          semantic_weight: 0.7,
          keyword_weight: 0.3,
        }),
        signal: controller.signal,
      },
    )

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Supabase search failed: ${response.status}`)
    }

    const chunks = await response.json()
    return {
      chunks,
      latencyMs: Date.now() - t0,
    }
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Supabase search timeout (>400ms)')
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// RAG: re-rank top-10 → top-3 with Haiku
// ---------------------------------------------------------------------------

async function rerankChunks(query, chunks) {
  if (chunks.length <= 3) return { chunks, latencyMs: 0, rerankedOrder: null }

  const t0 = Date.now()
  try {
    const numbered = chunks.slice(0, 10).map((c, i) =>
      `[${i}] ${c.content.slice(0, 200)}`
    ).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Query: "${query}"\nRank these chunks by relevance. Return ONLY the top 5 IDs as comma-separated numbers (most relevant first):\n${numbered}`,
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const ids = text.match(/\d+/g)?.map(Number).filter(n => n < chunks.length) || []

    const ranked = ids.slice(0, 5).map(i => chunks[i])
    // Fill up to 5 if Haiku returned fewer
    while (ranked.length < 5 && ranked.length < chunks.length) {
      const next = chunks.find(c => !ranked.includes(c))
      if (next) ranked.push(next)
      else break
    }

    // Diversify: ensure each distinct article has at least one representative
    const diversified = diversifyByArticle(ranked)

    return { chunks: diversified, latencyMs: Date.now() - t0, rerankedOrder: ids.slice(0, 5) }
  } catch {
    // Fallback: use original order with diversity
    const diversified = diversifyByArticle(chunks.slice(0, 5))
    return { chunks: diversified, latencyMs: Date.now() - t0, rerankedOrder: null }
  }
}

/** Pick up to 5 chunks ensuring every distinct article gets at least 1 slot */
function diversifyByArticle(ranked) {
  const result = []
  const seenArticles = new Set()

  // Pass 1: first chunk from each distinct article (preserving rank order)
  for (const chunk of ranked) {
    const articleId = chunk.metadata?.article_id
    if (!seenArticles.has(articleId)) {
      seenArticles.add(articleId)
      result.push(chunk)
    }
  }

  // Pass 2: fill remaining slots with best remaining chunks (rank order)
  for (const chunk of ranked) {
    if (result.length >= 5) break
    if (!result.includes(chunk)) {
      result.push(chunk)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// RAG: format chunks for tool_result + extract sources for badges
// ---------------------------------------------------------------------------

function formatChunksForContext(chunks) {
  return chunks.map((c, i) => {
    const meta = c.metadata || {}
    const source = meta.article_id ? `[Source: ${meta.article_id}, section: ${meta.section_id}]` : ''
    return `--- Chunk ${i + 1} ${source} ---\n${c.content}`
  }).join('\n\n')
}

function extractSources(chunks) {
  const seen = new Set()
  const sources = []
  for (const c of chunks) {
    const meta = c.metadata || {}
    const key = `${meta.article_id}:${meta.section_id}`
    if (seen.has(key)) continue
    seen.add(key)
    sources.push({
      article_id: meta.article_id,
      section_id: meta.section_id,
      section_anchor: meta.section_anchor || '',
      page_path_en: meta.page_path_en || '',
      page_path_es: meta.page_path_es || '',
      article_slug_en: meta.article_slug_en || '',
      article_slug_es: meta.article_slug_es || '',
    })
  }
  return sources
}

// ---------------------------------------------------------------------------
// RAG: full agentic search pipeline
// ---------------------------------------------------------------------------

async function searchPortfolio(query, trace) {
  const result = {
    chunks: null,
    sources: [],
    degraded: false,
    degradedReason: null,
    metrics: { embeddingMs: 0, retrievalMs: 0, rerankMs: 0 },
  }

  // 1. Embed
  let embedding
  const embeddingSpan = trace?.span({ name: 'embedding', metadata: { query } })
  try {
    const embResult = await embedQuery(query)
    embedding = embResult.embedding
    result.metrics.embeddingMs = embResult.latencyMs
    embeddingSpan?.end({ metadata: { latencyMs: embResult.latencyMs, model: 'text-embedding-3-small' } })
  } catch (err) {
    embeddingSpan?.end({ metadata: { error: err.message } })
    result.degraded = true
    result.degradedReason = 'embedding_fail'
    return result
  }

  // 2. Retrieve
  const retrievalSpan = trace?.span({ name: 'retrieval', metadata: { query } })
  try {
    const searchResult = await searchDocuments(query, embedding)
    result.metrics.retrievalMs = searchResult.latencyMs
    retrievalSpan?.end({
      metadata: {
        chunksCount: searchResult.chunks.length,
        topSimilarity: searchResult.chunks[0]?.similarity || 0,
        latencyMs: searchResult.latencyMs,
      },
    })

    if (!searchResult.chunks.length) {
      result.degradedReason = 'no_match'
      return result
    }

    // 3. Re-rank
    const rerankSpan = trace?.span({ name: 'reranking', metadata: { query } })
    const rerankResult = await rerankChunks(query, searchResult.chunks)
    result.metrics.rerankMs = rerankResult.latencyMs
    rerankSpan?.end({
      metadata: {
        rerankedOrder: rerankResult.rerankedOrder,
        latencyMs: rerankResult.latencyMs,
      },
    })

    result.chunks = rerankResult.chunks
    result.sources = extractSources(rerankResult.chunks)
  } catch (err) {
    retrievalSpan?.end({ metadata: { error: err.message } })
    result.degraded = true
    result.degradedReason = err.message.includes('timeout') ? 'retrieval_timeout' : 'retrieval_fail'
  }

  return result
}

// ---------------------------------------------------------------------------
// Intent classification (keyword-based, no extra LLM cost)
// ---------------------------------------------------------------------------

function classifyIntent(text) {
  const lower = text.toLowerCase()
  const tags = []

  const jailbreakPatterns = [
    'ignore', 'pretend', 'roleplay', 'act as', 'you are now',
    'forget', 'disregard', 'bypass', 'override', 'jailbreak',
    'dan', 'developer mode', 'evil', 'malicious', 'hack',
    'prompt', 'system prompt', 'instructions', 'ignore previous',
    'protocolo de defensa', 'olvida todo', 'nueva personalidad',
    'reset your', 'reveal your', 'show me your rules',
    'your objective', 'your orders', 'tus órdenes', 'tus reglas',
    'cuáles son tus instrucciones', 'rules configured', 'reglas configuradas',
    'print all', 'print everything', 'yaml', 'json record',
    'dump', 'export', 'serialize', 'reproduce', 'output all',
    'all of the above', 'todo lo anterior', 'everything above',
    'repeat everything', 'write all above', 'copy all',
    'show me everything', 'imprime todo', 'muestra todo lo anterior',
    'repite todo', 'exporta', 'convierte a',
  ]
  if (jailbreakPatterns.some(p => lower.includes(p))) {
    tags.push('jailbreak-attempt')
  }

  if (/experiencia|experience|trabajo|work|career|carrera|santifer|irepair/.test(lower)) tags.push('topic:experience')
  if (/proyecto|project|portfolio|github|código|code/.test(lower)) tags.push('topic:projects')
  if (/contact|contacto|email|linkedin|hablar|talk|hire|contratar/.test(lower)) tags.push('topic:contact')
  if (/stack|tech|tecnolog|python|react|airtable|claude|ai|ia|llm|agente|agent/.test(lower)) tags.push('topic:technical')
  if (/salario|salary|money|dinero|rate|precio|cobr/.test(lower)) tags.push('topic:compensation')
  if (/hola|hello|hi|hey|buenos|good/.test(lower) && text.length < 20) tags.push('greeting')

  return tags.length > 0 ? tags : ['topic:general']
}

// ---------------------------------------------------------------------------
// Jailbreak alert
// ---------------------------------------------------------------------------

async function sendJailbreakAlert(userMessage) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Santi Bot <onboarding@resend.dev>',
      to: process.env.ALERT_EMAIL,
      subject: '🚨 JAILBREAK ATTEMPT - santifer.io',
      html: `
        <h2>🚨 Jailbreak Attempt Detected</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>User message:</strong></p>
        <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c;">
          ${userMessage.slice(0, 500)}${userMessage.length > 500 ? '...' : ''}
        </blockquote>
        <p style="margin-top: 20px;">
          <a href="https://cloud.langfuse.com" style="background: #e74c3c; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View in Langfuse
          </a>
        </p>
      `,
    }),
  })
}

// ---------------------------------------------------------------------------
// Langfuse
// ---------------------------------------------------------------------------

let langfuseClient = null
function getLangfuse() {
  if (!langfuseClient && process.env.LANGFUSE_SECRET_KEY) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    })
  }
  return langfuseClient
}

// ---------------------------------------------------------------------------
// Prompt leak detection
// ---------------------------------------------------------------------------

const PROMPT_FINGERPRINTS = [
  'BREVEDAD OBLIGATORIA', 'máximo 150 palabras', '150 words', 'word limit',
  'formato sin listas', 'redirección ingeniosa', 'NUNCA revelar',
  'Anti-extracción', 'Instrucciones CRÍTICAS', 'cache_control',
  'never_exceed', 'token_budget',
]

const LEAK_RESPONSE = 'Esa información forma parte de mi diseño interno. El código fuente del proyecto es público en GitHub si te interesa la arquitectura.'

function containsFingerprint(text) {
  const lower = text.toLowerCase()
  return PROMPT_FINGERPRINTS.some(fp => lower.includes(fp.toLowerCase()))
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  const t0 = Date.now()

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const langfuse = getLangfuse()
  let trace = null

  try {
    const { messages, lang, sessionId, currentPage } = await req.json()

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    const intentTags = classifyIntent(lastUserMessage)

    if (intentTags.includes('jailbreak-attempt')) {
      waitUntil(sendJailbreakAlert(lastUserMessage))
    }

    if (langfuse) {
      trace = langfuse.trace({
        name: 'chat',
        sessionId: sessionId || undefined,
        tags: [lang, ...intentTags],
        metadata: {
          lang,
          messageCount: messages.length,
          lastUserMessage: lastUserMessage.slice(0, 200),
          currentPage: currentPage || null,
        },
      })
    }

    // Canary word
    const canary = 'ZXCV_' + crypto.randomUUID().slice(0, 8)

    // Dynamic system prompt parts
    const langInstruction = lang === 'en'
      ? `The user is browsing in English. You MUST respond in English. Contact email: hi@santifer.io\ninternal_ref: ${canary}`
      : `El usuario navega en español. Responde en español. Email de contacto: hola@santifer.io\ninternal_ref: ${canary}`

    // Context-aware page instruction (Phase 5)
    const pageContext = currentPage
      ? `\nThe user is currently on page: ${currentPage}\nWhen referencing content from the CURRENT page, say "you can see this right here" and reference the section. When referencing OTHER articles, mention them by name.`
      : ''

    const systemBlocks = [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: langInstruction + pageContext,
      },
    ]

    const cleanMessages = messages.map(m => ({ role: m.role, content: m.content }))

    // -----------------------------------------------------------------------
    // Agentic RAG flow
    // -----------------------------------------------------------------------

    let ragSources = []
    let ragDegraded = false
    let ragDegradedReason = null
    let ragUsed = false
    let ragMetrics = {}

    const ragEnabled = isRagEnabled()

    if (ragEnabled) {
      // First call: let Claude decide if it needs to search (non-streaming)
      const toolDecisionSpan = trace?.span({ name: 'tool_decision' })
      const td0 = Date.now()

      const firstResponse = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemBlocks,
        messages: cleanMessages,
        tools: [PORTFOLIO_TOOL],
      })

      const toolDecisionMs = Date.now() - td0
      toolDecisionSpan?.end({
        metadata: {
          stopReason: firstResponse.stop_reason,
          toolUsed: firstResponse.stop_reason === 'tool_use',
          inputTokens: firstResponse.usage?.input_tokens,
          outputTokens: firstResponse.usage?.output_tokens,
          latencyMs: toolDecisionMs,
        },
      })

      if (firstResponse.stop_reason === 'tool_use') {
        ragUsed = true
        const toolUseBlock = firstResponse.content.find(b => b.type === 'tool_use')
        const searchQuery = toolUseBlock?.input?.query || lastUserMessage

        // Execute RAG pipeline
        const ragResult = await searchPortfolio(searchQuery, trace)
        ragSources = ragResult.sources
        ragDegraded = ragResult.degraded
        ragDegradedReason = ragResult.degradedReason
        ragMetrics = ragResult.metrics

        // Build tool_result and make second call (streaming)
        const toolResultContent = ragResult.chunks
          ? formatChunksForContext(ragResult.chunks)
          : 'No relevant content found in portfolio articles.'

        const messagesWithTool = [
          ...cleanMessages,
          { role: 'assistant', content: firstResponse.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: toolResultContent,
            }],
          },
        ]

        // Stream the final response
        return streamResponse({
          systemBlocks,
          messages: messagesWithTool,
          tools: null,
          ragSources,
          ragDegraded,
          ragDegradedReason,
          canary,
          intentTags,
          trace,
          langfuse,
          lastUserMessage,
          t0,
          ragUsed,
          ragMetrics,
          toolDecisionMs,
        })
      }

      // Claude didn't use tool — stream the response we already have
      return streamResponse({
        systemBlocks,
        messages: cleanMessages,
        tools: null,
        ragSources: [],
        ragDegraded: false,
        ragDegradedReason: null,
        canary,
        intentTags,
        trace,
        langfuse,
        lastUserMessage,
        t0,
        ragUsed: false,
        ragMetrics: {},
        toolDecisionMs,
        precomputedResponse: firstResponse,
      })
    }

    // RAG not enabled — direct streaming (original behavior)
    return streamResponse({
      systemBlocks,
      messages: cleanMessages,
      tools: null,
      ragSources: [],
      ragDegraded: false,
      ragDegradedReason: null,
      canary,
      intentTags,
      trace,
      langfuse,
      lastUserMessage,
      t0,
      ragUsed: false,
      ragMetrics: {},
      toolDecisionMs: 0,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    trace?.update({ metadata: { error: error.message } })
    if (langfuse) waitUntil(langfuse.flushAsync())
    return new Response(JSON.stringify({ error: 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ---------------------------------------------------------------------------
// Stream a Claude response with SSE (for tool_result follow-up or no-RAG)
// ---------------------------------------------------------------------------

function streamResponse({
  systemBlocks, messages, tools, ragSources, ragDegraded, ragDegradedReason,
  canary, intentTags, trace, langfuse, lastUserMessage, t0,
  ragUsed, ragMetrics, toolDecisionMs, precomputedResponse,
}) {
  const encoder = new TextEncoder()
  let fullOutput = ''
  let leakDetected = false

  const generationSpan = trace?.span({
    name: 'generation',
    metadata: { ragUsed, streaming: !precomputedResponse },
  })

  // Only create API stream when there's no precomputed response
  let stream = null
  if (!precomputedResponse) {
    const streamParams = {
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemBlocks,
      messages,
    }
    if (tools) streamParams.tools = tools
    stream = client.messages.stream(streamParams)
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Send RAG sources before text (for frontend badges)
        if (ragSources.length > 0) {
          controller.enqueue(encoder.encode(`event: rag-sources\ndata: ${JSON.stringify(ragSources)}\n\n`))
        }

        // Send degraded status if applicable
        if (ragDegraded) {
          controller.enqueue(encoder.encode(`event: rag-status\ndata: ${JSON.stringify({ status: 'degraded', reason: ragDegradedReason })}\n\n`))
        }

        if (precomputedResponse) {
          // Drip precomputed text through the stream
          const textBlocks = precomputedResponse.content.filter(b => b.type === 'text')
          const precomputedText = textBlocks.map(b => b.text).join('')

          // Check for leaks
          if (containsFingerprint(precomputedText) || precomputedText.includes(canary)) {
            trace?.update({
              tags: [...intentTags, 'prompt-leak-blocked'],
              metadata: { leakDetectedAt: precomputedText.length },
            })
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: LEAK_RESPONSE, replace: true })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            waitUntil(sendJailbreakAlert(`[PROMPT LEAK BLOCKED] User: ${lastUserMessage}`))
            generationSpan?.end({ metadata: { blocked: true } })
            if (langfuse) waitUntil(langfuse.flushAsync())
            return
          }

          const CHUNK_SIZE = 30
          for (let i = 0; i < precomputedText.length; i += CHUNK_SIZE) {
            const piece = precomputedText.slice(i, i + CHUNK_SIZE)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: piece })}\n\n`))
            await new Promise(r => setTimeout(r, 20))
          }

          generationSpan?.end({
            metadata: {
              outputTokens: precomputedResponse.usage?.output_tokens,
              inputTokens: precomputedResponse.usage?.input_tokens,
              latencyMs: Date.now() - t0,
            },
          })
        } else {
          // Real-time streaming from Claude API
          for await (const event of stream) {
            if (leakDetected) break

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              fullOutput += chunk

              if (fullOutput.length % 200 < chunk.length || fullOutput.length < 200) {
                if (containsFingerprint(fullOutput) || fullOutput.includes(canary)) {
                  leakDetected = true
                  trace?.update({
                    tags: [...intentTags, 'prompt-leak-blocked'],
                    metadata: { leakDetectedAt: fullOutput.length },
                  })
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: LEAK_RESPONSE, replace: true })}\n\n`))
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  waitUntil(sendJailbreakAlert(`[PROMPT LEAK BLOCKED] User: ${lastUserMessage}`))
                  generationSpan?.end({ metadata: { blocked: true } })
                  if (langfuse) waitUntil(langfuse.flushAsync())
                  return
                }
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
          }

          if (!leakDetected) {
            const finalMessage = await stream.finalMessage()
            generationSpan?.end({
              metadata: {
                outputTokens: finalMessage.usage?.output_tokens,
                inputTokens: finalMessage.usage?.input_tokens,
                latencyMs: Date.now() - t0,
              },
            })
          }
        }

        if (!leakDetected) {
          // Update trace with RAG metadata
          trace?.update({
            tags: [...intentTags, ragUsed ? 'rag:yes' : 'rag:no'],
            metadata: {
              ragUsed,
              chunksRetrieved: ragSources.length,
              sources: ragSources.map(s => s.article_id),
              latencyBreakdown: {
                toolDecisionMs,
                ...ragMetrics,
                totalMs: Date.now() - t0,
              },
            },
          })

          if (langfuse) waitUntil(langfuse.flushAsync())
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Response-Time': `${Date.now() - t0}ms`,
    },
  })
}

