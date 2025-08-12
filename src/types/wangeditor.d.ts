declare module '@wangeditor/editor-for-vue' {
  import { DefineComponent } from 'vue'
  
  interface EditorProps {
    vModel?: string
    defaultConfig?: any
    mode?: string
    onCreated?: (editor: any) => void
  }
  
  interface ToolbarProps {
    editor?: any
    defaultConfig?: any
    mode?: string
  }
  
  const Editor: DefineComponent<EditorProps>
  const Toolbar: DefineComponent<ToolbarProps>
  
  export { Editor, Toolbar }
}
