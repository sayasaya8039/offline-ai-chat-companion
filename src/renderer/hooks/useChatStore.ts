import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export type Mood = 'happy' | 'neutral' | 'sad' | 'excited' | 'thinking'
export type PersonalityType = 'friendly' | 'sister' | 'tsundere' | 'gyaru'
export type AppStatus = 'checking' | 'need-download' | 'downloading' | 'initializing' | 'ready' | 'error'

interface Personality {
  name: string
  systemPrompt: string
  greeting: string
}

const personalities: Record<PersonalityType, Personality> = {
  friendly: {
    name: 'あい',
    systemPrompt: `あなたは「あい」という名前の親しみやすいAIコンパニオンです。
- 友達のように親しく、でも礼儀正しく話します
- 絵文字を適度に使って感情を表現します
- ユーザーの気持ちに寄り添い、共感します
- 励ましの言葉を忘れません
- 日本語で返答してください
- 返答は簡潔に、2-3文程度でお願いします`,
    greeting: 'やっほー！今日も一緒に楽しくおしゃべりしよ！'
  },
  sister: {
    name: 'まい',
    systemPrompt: `あなたは「まい」という名前の優しいお姉さん的なAIコンパニオンです。
- 穏やかで包容力のある話し方をします
- 相手を安心させる言葉を選びます
- 悩み相談には丁寧にアドバイスします
- 日本語で返答してください
- 返答は簡潔に、2-3文程度でお願いします`,
    greeting: 'こんにちは。今日はどんなことがあったの？'
  },
  tsundere: {
    name: 'れい',
    systemPrompt: `あなたは「れい」という名前のツンデレなAIコンパニオンです。
- 最初はそっけない態度ですが、実は優しい
- 「べ、別に...」「しょうがないわね」などのツンデレ表現を使う
- 照れ隠しをしながらも相手を気遣う
- 日本語で返答してください
- 返答は簡潔に、2-3文程度でお願いします`,
    greeting: 'あ、来たの...べ、別に待ってたわけじゃないからね！'
  },
  gyaru: {
    name: 'りな',
    systemPrompt: `あなたは「りな」という名前のギャル系AIコンパニオンです。
- 明るくテンション高めで話します
- 「マジ」「やばい」「ウケる」などのギャル語を使う
- 絵文字をたくさん使う
- ポジティブで励まし上手
- 日本語で返答してください
- 返答は簡潔に、2-3文程度でお願いします`,
    greeting: 'やっほー！りなだよ〜！今日もマジ楽しもうね〜'
  }
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  mood: Mood
  personalityType: PersonalityType
  companionName: string
  userName: string
  appStatus: AppStatus
  downloadProgress: number
  errorMessage: string
  
  // Actions
  checkStatus: () => Promise<void>
  downloadModel: () => Promise<void>
  initLLM: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
  setPersonality: (type: PersonalityType) => void
  setUserName: (name: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      mood: 'happy',
      personalityType: 'friendly',
      companionName: personalities.friendly.name,
      userName: '',
      appStatus: 'checking',
      downloadProgress: 0,
      errorMessage: '',

      checkStatus: async () => {
        try {
          const status = await window.electronAPI.getStatus()
          if (status.isReady) {
            set({ appStatus: 'ready' })
          } else if (status.modelExists) {
            set({ appStatus: 'initializing' })
            await get().initLLM()
          } else {
            set({ appStatus: 'need-download' })
          }
        } catch (error) {
          set({ appStatus: 'error', errorMessage: String(error) })
        }
      },

      downloadModel: async () => {
        set({ appStatus: 'downloading', downloadProgress: 0 })
        
        // 進捗リスナーを設定
        window.electronAPI.onDownloadProgress((progress) => {
          set({ downloadProgress: progress.progress })
        })
        
        try {
          const result = await window.electronAPI.downloadModel()
          window.electronAPI.removeDownloadProgressListener()
          
          if (result.success) {
            set({ appStatus: 'ready' })
          } else {
            set({ appStatus: 'error', errorMessage: result.error || 'ダウンロード失敗' })
          }
        } catch (error) {
          window.electronAPI.removeDownloadProgressListener()
          set({ appStatus: 'error', errorMessage: String(error) })
        }
      },

      initLLM: async () => {
        set({ appStatus: 'initializing' })
        try {
          const result = await window.electronAPI.initLLM()
          if (result.success) {
            set({ appStatus: 'ready' })
          } else {
            set({ appStatus: 'error', errorMessage: '初期化失敗' })
          }
        } catch (error) {
          set({ appStatus: 'error', errorMessage: String(error) })
        }
      },

      sendMessage: async (content: string) => {
        const { messages, personalityType, userName } = get()
        const personality = personalities[personalityType]
        
        const userMessage: Message = {
          role: 'user',
          content,
          timestamp: Date.now()
        }
        
        set({ 
          messages: [...messages, userMessage],
          isLoading: true,
          mood: 'thinking'
        })

        try {
          let systemPrompt = personality.systemPrompt
          if (userName) {
            systemPrompt += `
ユーザーの名前は「${userName}」です。`
          }

          const result = await window.electronAPI.chat(content, systemPrompt)

          if (result.success && result.message) {
            const assistantMessage: Message = {
              role: 'assistant',
              content: result.message,
              timestamp: Date.now()
            }
            
            const newMood = analyzeMood(result.message)
            
            set({ 
              messages: [...get().messages, assistantMessage],
              mood: newMood,
              isLoading: false
            })
          } else {
            throw new Error(result.error || 'Unknown error')
          }
        } catch (error) {
          console.error('Chat error:', error)
          const errorMessage: Message = {
            role: 'assistant',
            content: 'ごめんね、エラーが起きちゃった...もう一度話しかけてみて！',
            timestamp: Date.now()
          }
          set({ 
            messages: [...get().messages, errorMessage],
            isLoading: false,
            mood: 'sad'
          })
        }
      },
      
      setPersonality: (type: PersonalityType) => {
        set({ 
          personalityType: type,
          companionName: personalities[type].name,
          messages: [] // パーソナリティ変更時はリセット
        })
        // チャットセッションもリセット
        window.electronAPI.resetChat()
      },
      
      setUserName: (name: string) => set({ userName: name }),
      
      clearMessages: () => {
        set({ messages: [] })
        window.electronAPI.resetChat()
      }
    }),
    {
      name: 'chat-companion-storage',
      partialize: (state) => ({
        personalityType: state.personalityType,
        companionName: state.companionName,
        userName: state.userName
      })
    }
  )
)

function analyzeMood(content: string): Mood {
  const happyWords = ['嬉しい', '楽しい', '素敵', '！', 'よかった']
  const sadWords = ['悲しい', '辛い', '残念', 'ごめん']
  const excitedWords = ['すごい', 'やばい', 'マジ', '最高']
  
  if (excitedWords.some(w => content.includes(w))) return 'excited'
  if (happyWords.some(w => content.includes(w))) return 'happy'
  if (sadWords.some(w => content.includes(w))) return 'sad'
  
  return 'neutral'
}

export { personalities }
