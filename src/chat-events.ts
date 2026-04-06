// Standalone event module to avoid circular imports between main.tsx and App.tsx
export const OPEN_CHAT_EVENT = 'open-floating-chat'

export function openFloatingChat() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT))
}
