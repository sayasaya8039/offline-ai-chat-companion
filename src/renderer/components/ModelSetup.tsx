import { Download, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useChatStore } from '../hooks/useChatStore'

export function ModelSetup() {
  const { appStatus, downloadProgress, errorMessage, downloadModel, initLLM } = useChatStore()

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-icon">
          <Sparkles size={48} />
        </div>
        
        <h2>AIチャットコンパニオン</h2>
        
        {appStatus === 'checking' && (
          <div className="setup-status">
            <Loader2 className="spin" size={24} />
            <p>状態を確認中...</p>
          </div>
        )}
        
        {appStatus === 'need-download' && (
          <div className="setup-status">
            <p className="setup-description">
              AIモデルをダウンロードして<br />
              オフラインで会話できるようにしましょう！
            </p>
            <p className="model-info">
              gemma-2-2b-jpn-it (約1.5GB)
            </p>
            <button onClick={downloadModel} className="download-btn">
              <Download size={20} />
              モデルをダウンロード
            </button>
          </div>
        )}
        
        {appStatus === 'downloading' && (
          <div className="setup-status">
            <Loader2 className="spin" size={24} />
            <p>ダウンロード中... {downloadProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="download-hint">
              初回のみ必要です。次回からはオフラインで動作します。
            </p>
          </div>
        )}
        
        {appStatus === 'initializing' && (
          <div className="setup-status">
            <Loader2 className="spin" size={24} />
            <p>AIを起動中...</p>
            <p className="download-hint">
              少しお待ちください
            </p>
          </div>
        )}
        
        {appStatus === 'error' && (
          <div className="setup-status error">
            <AlertCircle size={24} />
            <p>エラーが発生しました</p>
            <p className="error-message">{errorMessage}</p>
            <button onClick={initLLM} className="retry-btn">
              再試行
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
