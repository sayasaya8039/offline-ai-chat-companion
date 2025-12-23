/// <reference types="vite/client" />

interface DownloadProgress {
  downloaded: number
  total: number
  progress: number
}

interface LLMStatus {
  modelExists: boolean
  modelName: string
  isReady: boolean
}

interface ElectronAPI {
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

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
