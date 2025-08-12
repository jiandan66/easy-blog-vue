<template>
  <div class="article-edit-page">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑博客' : '新增博客' }}</h2>
      </div>
             <div class="header-right">
         <el-button @click="handleSave" :loading="saveLoading">
           保存
         </el-button>
         <el-button @click="handlePublish" type="primary" :loading="publishLoading">
           发布
         </el-button>
       </div>
    </div>

    <div class="edit-container">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
        class="edit-form"
      >
        <el-row :gutter="20">
          <el-col :span="16">
            <!-- 文章标题 -->
            <el-form-item label="文章标题" prop="title">
              <el-input 
                v-model="editForm.title" 
                placeholder="请输入文章标题"
                size="large"
                class="title-input"
              />
            </el-form-item>

                         <!-- 富文本编辑器 -->
             <el-form-item label="文章内容" prop="content">
               <div class="editor-container">
                 <Toolbar
                   style="border-bottom: 1px solid #ccc"
                   :editor="editorRef"
                   :defaultConfig="toolbarConfig"
                   :mode="mode"
                 />
                 <Editor
                   style="height: 500px; overflow-y: hidden;"
                   v-model="editForm.content"
                   :defaultConfig="editorConfig"
                   :mode="mode"
                   @onCreated="handleCreated"
                 />
               </div>
             </el-form-item>
          </el-col>

          <el-col :span="8">
            <div class="sidebar">
                             <!-- 文章标签 -->
               <div class="sidebar-section">
                 <h3>文章标签</h3>
                 <el-form-item label="标签">
                   <el-select 
                     v-model="editForm.tagId" 
                     multiple
                     placeholder="请选择标签" 
                     style="width: 100%"
                   >
                                           <el-option 
                        v-for="tag in categoryList" 
                        :key="tag.tagId" 
                        :label="tag.tagName" 
                        :value="tag.tagId"
                      />
                   </el-select>
                 </el-form-item>
               </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, shallowRef, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import {
  api_article_edit,
  api_article_save,
  api_article_detail,
  api_tag_list
} from "@/api/api.ts";
import type { ArticleItem, TagItem } from "@/page/article/article.ts";

const route = useRoute();
const router = useRouter();

const editFormRef = ref<FormInstance>();
const categoryList = ref<TagItem[]>([]);

// 判断是否为编辑模式
const isEdit = computed(() => !!route.params.id);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()



const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }
const mode = 'default'

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor: any) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

// 保存状态
const saveLoading = ref(false);
const publishLoading = ref(false);

// 编辑表单
const editForm = reactive({
  articleId: 0,
  title: '',
  content: '',
  frontCover: '',
  tagId: [] as string[],
  status: '0'
});

// 表单验证规则
const editFormRules = computed<FormRules>(() => ({
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}));

// 获取分类列表
const loadCategoryList = async () => {
  try {
    const { code, data } = await api_tag_list({ current: 1, size: 1000 });
    if (code === 0) {
      categoryList.value = data.records || [];
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

// 加载文章详情
const loadArticleDetail = async () => {
  if (!isEdit.value) return;
  
  try {
    const articleId = route.params.id as string;
    const { code, data } = await api_article_detail(articleId);
    if (code === 0 && data) {
      // 回显数据到表单
      editForm.articleId = data.articleId || 0;
      editForm.title = data.title || '';
      editForm.frontCover = data.frontCover || '';
      editForm.status = data.status || '0';
      
      // 处理标签数据
      if (data.tagList && Array.isArray(data.tagList)) {
        editForm.tagId = data.tagList.map((tag: any) => tag.tagId);
      }
      
      // 延迟设置富文本编辑器内容，确保编辑器已初始化
      setTimeout(() => {
        editForm.content = data.content || '';
      }, 100);
    }
  } catch (error) {
    console.error('获取文章详情失败:', error);
    ElMessage.error('获取文章详情失败');
  }
};



// 返回上一页
const goBack = () => {
  router.back();
};

// 保存文章（草稿）
const handleSave = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();
    saveLoading.value = true;

    editForm.status = '0'; // 保存为草稿
    const submitData = { ...editForm };

    if (isEdit.value) {
      const { data } = await api_article_edit(submitData);
      if (data) {
        ElMessage.success("保存草稿成功");
        router.push('/blog/article/list');
      } else {
        ElMessage.error("保存草稿失败");
      }
    } else {
      const { data } = await api_article_save(submitData);
      if (data) {
        ElMessage.success("保存草稿成功");
        router.push('/blog/article/list');
      } else {
        ElMessage.error("保存草稿失败");
      }
    }
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    saveLoading.value = false;
  }
};

// 发布文章
const handlePublish = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();
    publishLoading.value = true;

    editForm.status = '1'; // 发布状态
    const submitData = { ...editForm };

    if (isEdit.value) {
      const { data } = await api_article_edit(submitData);
      if (data) {
        ElMessage.success("发布博客成功");
        router.push('/blog/article/list');
      } else {
        ElMessage.error("发布博客失败");
      }
    } else {
      const { data } = await api_article_save(submitData);
      if (data) {
        ElMessage.success("发布博客成功");
        router.push('/blog/article/list');
      } else {
        ElMessage.error("发布博客失败");
      }
    }
  } catch (error) {
    console.error('发布失败:', error);
  } finally {
    publishLoading.value = false;
  }
};



onMounted(async () => {
  await loadCategoryList();
  if (isEdit.value) {
    await loadArticleDetail();
  }
});
</script>

<style scoped>
.article-edit-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 12px;
}

.edit-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.edit-form {
  padding: 20px;
}

.title-input {
  font-size: 18px;
  font-weight: 500;
}

.sidebar {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  height: fit-content;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.tags-container {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

/* WangEditor编辑器样式 */
.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-container .w-e-toolbar {
  border: none;
  border-bottom: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.editor-container .w-e-text-container {
  border: none;
  font-size: 14px;
  line-height: 1.6;
}
</style>
