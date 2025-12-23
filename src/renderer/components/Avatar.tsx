interface AvatarProps {
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'thinking'
}

const moodEmojis: Record<AvatarProps['mood'], string> = {
  happy: '😊',
  neutral: '😌',
  sad: '😢',
  excited: '🥰',
  thinking: '🤔'
}

export function Avatar({ mood }: AvatarProps) {
  return (
    <div className={`avatar avatar-${mood}`}>
      <div className="avatar-face">
        {moodEmojis[mood]}
      </div>
      <div className="avatar-glow" />
    </div>
  )
}
