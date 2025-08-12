declare module 'vue-quill-editor' {
  import { DefineComponent } from 'vue'
  
  interface QuillOptions {
    placeholder?: string
    modules?: {
      toolbar?: any[]
    }
  }
  
  interface VueQuillEditorProps {
    content?: string
    options?: QuillOptions
    contentType?: string
    theme?: string
  }
  
  const VueQuillEditor: DefineComponent<VueQuillEditorProps>
  export default VueQuillEditor
}
