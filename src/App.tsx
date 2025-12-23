import { useEffect } from 'react'
import { TitleBar } from './renderer/components/TitleBar'
import { ChatWindow } from './renderer/components/ChatWindow'
import { Avatar } from './renderer/components/Avatar'
import { ModelSetup } from './renderer/components/ModelSetup'
import { useChatStore } from './renderer/hooks/useChatStore'

function App() {
  const { companionName, mood, appStatus, checkStatus } = useChatStore()

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return (
    <div className="app-container">
      <TitleBar />
      
      {appStatus === 'ready' ? (
        <div className="main-content">
          <Avatar mood={mood} />
          <div className="companion-name">{companionName}</div>
          <ChatWindow />
        </div>
      ) : (
        <ModelSetup />
      )}
    </div>
  )
}

export default App
