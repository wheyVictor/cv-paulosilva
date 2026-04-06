import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openFloatingChat } from '../../src/chat-events'

describe('FloatingChat open event', () => {
  let handler: ReturnType<typeof vi.fn>

  beforeEach(() => {
    handler = vi.fn()
    window.addEventListener('open-floating-chat', handler)
  })

  afterEach(() => {
    window.removeEventListener('open-floating-chat', handler)
  })

  it('openFloatingChat dispatches the custom event', () => {
    openFloatingChat()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('event is a CustomEvent with correct type', () => {
    let receivedEvent: Event | null = null
    const captureHandler = (e: Event) => { receivedEvent = e }
    window.addEventListener('open-floating-chat', captureHandler)

    openFloatingChat()

    expect(receivedEvent).toBeInstanceOf(CustomEvent)
    expect(receivedEvent!.type).toBe('open-floating-chat')

    window.removeEventListener('open-floating-chat', captureHandler)
  })

  it('multiple calls dispatch multiple events', () => {
    openFloatingChat()
    openFloatingChat()
    openFloatingChat()
    expect(handler).toHaveBeenCalledTimes(3)
  })
})
