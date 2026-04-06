import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { openFloatingChat } from '../../src/chat-events'

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...filterProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Filter out motion-specific props that React DOM doesn't understand
function filterProps(props: Record<string, any>) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
  return rest
}

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <span>{children}</span>,
}))

// jsdom doesn't implement scrollTo
Element.prototype.scrollTo = vi.fn()

describe('FloatingChat open via event', () => {
  it('openFloatingChat dispatches a CustomEvent on window', () => {
    const handler = vi.fn()
    window.addEventListener('open-floating-chat', handler)
    openFloatingChat()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
    window.removeEventListener('open-floating-chat', handler)
  })

  it('FloatingChat component opens when event is dispatched', async () => {
    // Dynamic import to apply mocks first
    const { default: FloatingChat } = await import('../../src/FloatingChat')

    const { container } = render(<FloatingChat lang="en" />)

    // Chat panel should NOT be visible initially
    expect(screen.queryByText('What is your experience?')).not.toBeInTheDocument()

    // Dispatch the open event
    act(() => {
      openFloatingChat()
    })

    // Chat panel SHOULD now be visible (suggestions are shown when chat is open with no messages)
    await waitFor(() => {
      expect(screen.getByText('What is your experience?')).toBeInTheDocument()
    })
  })

  it('FloatingChat opens via direct state when clicking the floating button', async () => {
    const { default: FloatingChat } = await import('../../src/FloatingChat')

    render(<FloatingChat lang="en" />)

    // Find and click the floating chat button
    const openButton = screen.getByLabelText('Open chat')
    act(() => {
      openButton.click()
    })

    await waitFor(() => {
      expect(screen.getByText('What is your experience?')).toBeInTheDocument()
    })
  })
})
