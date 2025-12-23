import type { Message } from '../hooks/useChatStore'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble-content">
        {message.content}
      </div>
      <div className="bubble-time">
        {new Date(message.timestamp).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}
