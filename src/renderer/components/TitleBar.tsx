import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const handleMinimize = () => window.electronAPI.minimize()
  const handleMaximize = () => window.electronAPI.maximize()
  const handleClose = () => window.electronAPI.close()

  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <span className="title-text">AIチャットコンパニオン</span>
      </div>
      <div className="title-bar-buttons">
        <button onClick={handleMinimize} className="title-btn">
          <Minus size={14} />
        </button>
        <button onClick={handleMaximize} className="title-btn">
          <Square size={12} />
        </button>
        <button onClick={handleClose} className="title-btn close">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
