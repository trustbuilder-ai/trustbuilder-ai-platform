/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PUBLIC_ANON_KEY: string
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}