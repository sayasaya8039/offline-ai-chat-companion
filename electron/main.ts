import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// ESM互換の __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// LLM関連（動的インポートで遅延ロード）
let llama: any = null
let model: any = null
let context: any = null
let chatSession: any = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// モデル保存先
const MODELS_DIR = isDev 
  ? path.join(__dirname, '..', 'models')
  : path.join(app.getPath('userData'), 'models')

// 推奨モデル（軽量で日本語対応）
const DEFAULT_MODEL = {
  name: 'gemma-2-2b-jpn-it',
  url: 'https://huggingface.co/mmnga/gemma-2-2b-jpn-it-gguf/resolve/main/gemma-2-2b-jpn-it-Q4_K_M.gguf',
  filename: 'gemma-2-2b-jpn-it-Q4_K_M.gguf'
}

/** モデルディレクトリを確保 */
function ensureModelsDir(): void {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true })
  }
}

/** モデルが存在するか確認 */
function getModelPath(): string | null {
  ensureModelsDir()
  const modelPath = path.join(MODELS_DIR, DEFAULT_MODEL.filename)
  return fs.existsSync(modelPath) ? modelPath : null
}

/** LLMを初期化（動的インポート使用） */
async function initializeLlama(): Promise<boolean> {
  try {
    const modelPath = getModelPath()
    if (!modelPath) {
      console.log('モデルが見つかりません。ダウンロードが必要です。')
      return false
    }

    console.log('node-llama-cppを動的インポート中...')
    const nodeLlamaCpp = await import('node-llama-cpp')
    
    console.log('Llama初期化中...')
    llama = await nodeLlamaCpp.getLlama()
    
    console.log('モデル読み込み中...')
    model = await llama.loadModel({ modelPath })
    
    console.log('コンテキスト作成中...')
    context = await model.createContext()
    
    console.log('チャットセッション作成中...')
    chatSession = new nodeLlamaCpp.LlamaChatSession({
      contextSequence: context.getSequence()
    })
    
    console.log('LLM初期化完了!')
    return true
  } catch (error) {
    console.error('LLM初期化エラー:', error)
    return false
  }
}

/** メインウィンドウを作成 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    minWidth: 380,
    minHeight: 500,
    frame: false,
    transparent: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../resources/icon.png')
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
}

/** システムトレイを作成 */
function createTray(): void {
  const iconPath = path.join(__dirname, '../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '開く', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '終了', click: () => {
      tray?.destroy()
      tray = null
      app.quit()
    }}
  ])
  
  tray.setToolTip('AIチャットコンパニオン')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

// IPC handlers - ウィンドウ操作
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.hide())

// IPC handlers - LLM操作
ipcMain.handle('llm:status', async () => {
  const modelPath = getModelPath()
  return {
    modelExists: !!modelPath,
    modelName: DEFAULT_MODEL.name,
    isReady: !!chatSession
  }
})

ipcMain.handle('llm:download', async () => {
  ensureModelsDir()
  const modelPath = path.join(MODELS_DIR, DEFAULT_MODEL.filename)
  
  try {
    console.log('モデルダウンロード開始:', DEFAULT_MODEL.url)
    
    const response = await fetch(DEFAULT_MODEL.url)
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body is null')
    
    const chunks: Uint8Array[] = []
    let downloaded = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunks.push(value)
      downloaded += value.length
      
      const progress = total > 0 ? Math.round((downloaded / total) * 100) : 0
      mainWindow?.webContents.send('llm:download-progress', { 
        downloaded, 
        total, 
        progress 
      })
    }
    
    const buffer = Buffer.concat(chunks)
    fs.writeFileSync(modelPath, buffer)
    
    console.log('モデルダウンロード完了!')
    
    const success = await initializeLlama()
    return { success, modelPath }
  } catch (error) {
    console.error('ダウンロードエラー:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('llm:init', async () => {
  if (chatSession) {
    return { success: true, message: '既に初期化済み' }
  }
  const success = await initializeLlama()
  return { success }
})

ipcMain.handle('llm:chat', async (_event, userMessage: string, _systemPrompt: string) => {
  if (!chatSession) {
    return { success: false, error: 'LLMが初期化されていません' }
  }
  
  try {
    const response = await chatSession.prompt(userMessage, {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9
    })
    
    return { success: true, message: response }
  } catch (error) {
    console.error('チャットエラー:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('llm:reset', async () => {
  if (context) {
    try {
      const nodeLlamaCpp = await import('node-llama-cpp')
      chatSession = new nodeLlamaCpp.LlamaChatSession({
        contextSequence: context.getSequence()
      })
      return { success: true }
    } catch {
      return { success: false }
    }
  }
  return { success: false }
})

// App lifecycle
app.whenReady().then(async () => {
  createWindow()
  createTray()
  
  if (getModelPath()) {
    await initializeLlama()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  chatSession = null
  context = null
  model = null
  llama = null
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
