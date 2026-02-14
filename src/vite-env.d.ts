/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_CHAT_ROUNDS: string;
  // 其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
