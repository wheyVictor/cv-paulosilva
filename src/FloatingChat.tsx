import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Send, Loader2, MessageSquare, Briefcase, Rocket, HelpCircle, Mail } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = {
  pt: [
    { icon: Briefcase, text: 'Qual sua experiência?' },
    { icon: Rocket, text: 'Quais projetos já fez?' },
    { icon: HelpCircle, text: 'Por que devo te contratar?' },
    { icon: Mail, text: 'Como entro em contato?' },
  ],
  en: [
    { icon: Briefcase, text: 'What is your experience?' },
    { icon: Rocket, text: 'What projects have you built?' },
    { icon: HelpCircle, text: 'Why should I hire you?' },
    { icon: Mail, text: 'How can I contact you?' },
  ],
}

export default function FloatingChat({ lang, externalOpen, onOpenChange }: { lang: 'pt' | 'en'; externalOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenInternal] = useState(false)
  const setOpen = useCallback((value: boolean) => {
    setOpenInternal(value)
    onOpenChange?.(value)
  }, [onOpenChange])

  useEffect(() => {
    if (externalOpen) setOpenInternal(true)
  }, [externalOpen])

  // Listen for global open event directly
  useEffect(() => {
    const handler = () => setOpenInternal(true)
    window.addEventListener('open-floating-chat', handler)
    return () => window.removeEventListener('open-floating-chat', handler)
  }, [])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Add empty assistant message that will be streamed into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, lang }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullText += parsed.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: fullText }
                return updated
              })
            }
            if (parsed.error) {
              fullText += `\n\n*${parsed.error}*`
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: fullText }
                return updated
              })
            }
          } catch { /* ignore malformed JSON */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant' && !last.content) {
            const isDevMode = window.location.port === '5173'
            updated[updated.length - 1] = {
              role: 'assistant',
              content: isDevMode
                ? (lang === 'pt'
                  ? 'O chatbot requer `vercel dev` para funcionar (API routes). Com `vite dev` apenas o frontend funciona.'
                  : 'The chatbot requires `vercel dev` to work (API routes). With `vite dev` only the frontend works.')
                : (lang === 'pt'
                  ? 'Desculpe, ocorreu um erro. Tente novamente.'
                  : 'Sorry, an error occurred. Please try again.'),
            }
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const suggestions = SUGGESTIONS[lang]

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
            aria-label={lang === 'pt' ? 'Abrir chat' : 'Open chat'}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src="/foto-avatar-sm.webp" alt="Paulo Silva" className="w-full h-full object-cover" width={32} height={32} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Victor</p>
                  <p className="text-xs text-muted-foreground">{lang === 'pt' ? 'Assistente IA de Paulo' : "Paulo's AI assistant"}</p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); abortRef.current?.abort() }}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {lang === 'pt'
                      ? 'Olá! Sou Victor, assistente IA do Paulo. Pergunte o que quiser sobre minha experiência.'
                      : "Hi! I'm Victor, Paulo's AI assistant. Ask me anything about his experience."}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s.text)}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-left"
                      >
                        <s.icon className="w-3.5 h-3.5 shrink-0 text-primary" />
                        {s.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' ? (
                        msg.content ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                  {children}
                                </a>
                              ),
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
              className="px-4 py-3 border-t border-border flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'pt' ? 'Pergunte algo...' : 'Ask something...'}
                className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                disabled={streaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
