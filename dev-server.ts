/**
 * Local dev server plugin for Vite.
 * Proxies /api/chat to Claude API so the chatbot works with `npm run dev`.
 * Reads ANTHROPIC_API_KEY from .env.local.
 */
import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function devApiProxy(): Plugin {
  let systemPrompt = ''

  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      try {
        systemPrompt = readFileSync(join(process.cwd(), 'chatbot-prompt.txt'), 'utf-8')
      } catch {
        systemPrompt = 'You are Victor, the AI version of Paulo Victor Silva.'
      }

      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.writeHead(200)
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env.local' }))
          return
        }

        // Read body
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = JSON.parse(Buffer.concat(chunks).toString())

        const { messages, lang } = body || {}
        if (!messages?.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'messages array required' }))
          return
        }

        const recentMessages = messages.slice(-20).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '').slice(0, 2000),
        }))

        const langNote = lang === 'pt'
          ? '\n\nIMPORTANT: Respond in Brazilian Portuguese (PT-BR).'
          : '\n\nIMPORTANT: Respond in English.'

        try {
          const { default: Anthropic } = await import('@anthropic-ai/sdk')
          const client = new Anthropic({ apiKey })

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })

          const stream = client.messages.stream({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            system: systemPrompt + langNote,
            messages: recentMessages,
          })

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && (event.delta as { type: string; text?: string })?.type === 'text_delta') {
              res.write(`data: ${JSON.stringify({ text: (event.delta as { text: string }).text })}\n\n`)
            }
          }

          res.write('data: [DONE]\n\n')
          res.end()
        } catch (err) {
          const errMsg = (err as Error).message || 'Unknown error'
          console.error('Chat error:', errMsg)
          const userMsg = errMsg.includes('credit balance')
            ? 'API credit balance is too low. Add credits at console.anthropic.com.'
            : 'Failed to generate response.'
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: userMsg }))
          } else {
            res.write(`data: ${JSON.stringify({ error: userMsg })}\n\n`)
            res.end()
          }
        }
      })
    },
  }
}
