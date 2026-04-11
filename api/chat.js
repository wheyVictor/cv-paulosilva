import Anthropic from '@anthropic-ai/sdk'
import { systemPrompt as embeddedPrompt } from './_prompt.js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getKv, todayKey } from './_kv.js'

export const config = { runtime: 'nodejs', maxDuration: 30 }

// Simple in-memory rate limiter (per serverless instance)
const rateLimitMap = new Map()
const RATE_LIMIT = 20 // max requests per IP per window
const RATE_WINDOW = 60_000 // 1 minute

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let systemPrompt = embeddedPrompt
try {
  const filePrompt = readFileSync(join(__dirname, '..', 'chatbot-prompt.txt'), 'utf-8')
  if (filePrompt.trim()) systemPrompt = filePrompt
} catch {
  // Use embedded prompt (already set)
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://psilva.io')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI_GATEWAY_API_KEY not configured' })
  }

  try {
    const { messages, lang } = req.body || {}

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }

    // Limit conversation history and sanitize
    const recentMessages = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))

    const langNote = lang === 'pt'
      ? '\n\nIMPORTANT: Respond in Brazilian Portuguese (PT-BR).'
      : '\n\nIMPORTANT: Respond in English.'

    const client = new Anthropic({
      apiKey,
      baseURL: 'https://ai-gateway.vercel.sh',
    })

    // Stream response via SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://psilva.io')

    const stream = client.messages.stream({
      model: 'google/gemini-3-flash',
      max_tokens: 800,
      system: systemPrompt + langNote,
      messages: recentMessages,
    })

    let outputTokens = 0
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
      if (event.type === 'message_delta' && event.usage?.output_tokens) {
        outputTokens = event.usage.output_tokens
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()

    // Fire-and-forget: write chat stats to KV
    const kv = getKv()
    if (kv) {
      const date = todayKey()
      const inputTokens = recentMessages.reduce((s, m) => s + m.content.length / 4, 0)
      const totalTokens = Math.round(inputTokens) + outputTokens
      const cost = totalTokens * 0.000001 // Haiku 4.5 approximate cost
      kv.incr(`chat:${date}:conversations`).catch(() => {})
      kv.incrby(`chat:${date}:tokens`, totalTokens).catch(() => {})
      kv.incrbyfloat(`chat:${date}:cost`, cost).catch(() => {})
    }
  } catch (err) {
    console.error('Chat error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate response' })
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
      res.end()
    }
  }
}
