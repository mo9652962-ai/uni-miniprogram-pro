/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />
/// <reference types="@types/wechat-miniprogram" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** Vite 环境变量类型声明 */
interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
