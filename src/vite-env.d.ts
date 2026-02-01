/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTHING_APP_ID: string
  readonly VITE_AUTHING_APP_HOST: string
  readonly VITE_API_BASE_URL?: string
  readonly GEMINI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
