import { contextBridge, ipcRenderer } from 'electron'

export interface LLMStatus {
  modelExists: boolean
  modelName: string
  isReady: boolean
}

export interface DownloadProgress {
  downloaded: number
  total: number
  progress: number
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ウィンドウ操作
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // LLM操作
  getStatus: () => ipcRenderer.invoke('llm:status') as Promise<LLMStatus>,
  downloadModel: () => ipcRenderer.invoke('llm:download'),
  initLLM: () => ipcRenderer.invoke('llm:init'),
  chat: (message: string, systemPrompt: string) => 
    ipcRenderer.invoke('llm:chat', message, systemPrompt),
  resetChat: () => ipcRenderer.invoke('llm:reset'),
  
  // ダウンロード進捗リスナー
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    ipcRenderer.on('llm:download-progress', (_event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('llm:download-progress')
  }
})

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      getStatus: () => Promise<LLMStatus>
      downloadModel: () => Promise<{ success: boolean; modelPath?: string; error?: string }>
      initLLM: () => Promise<{ success: boolean; message?: string }>
      chat: (message: string, systemPrompt: string) => Promise<{ success: boolean; message?: string; error?: string }>
      resetChat: () => Promise<{ success: boolean }>
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
      removeDownloadProgressListener: () => void
    }
  }
}
