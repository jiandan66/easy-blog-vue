<template>
  <div class="article-management">
    <div class="page-header">
      <h2>博客管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="文章标题">
          <el-input
              v-model="searchForm.title"
              placeholder="请输入文章标题"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
              v-model="searchForm.tagId"
              multiple
              placeholder="请选择标签"
              clearable
              style="width: 200px"
          >
            <el-option
                v-for="tag in tagList"
                :key="tag.tagId"
                :label="tag.tagName"
                :value="tag.tagId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="草稿" value="0"/>
            <el-option label="已发布" value="1"/>
            <el-option label="已下架" value="2"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searchLoading">
            <el-icon>
              <Search/>
            </el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon>
              <Refresh/>
            </el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="handleAddArticle">新增博客</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="articleId" label="文章ID" min-width="180" show-overflow-tooltip/>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip/>
      <el-table-column label="标签" min-width="150" show-overflow-tooltip>
        <template #default="scope">
          <el-tag
              v-for="tag in scope.row.tagList"
              :key="tag.tagId"
              size="small"
              class="tag-item"
          >
            {{ tag.tagName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="80" align="center">
        <template #default="scope">
          <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
          >
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="160" show-overflow-tooltip/>
      <el-table-column prop="updateTime" label="更新时间" min-width="160" show-overflow-tooltip/>
      <el-table-column label="操作" min-width="180" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEditArticle(scope.row)">编辑</el-button>
          <el-popconfirm
              title="确定要删除这篇文章吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDeleteArticle(scope.row)"
          >
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>


  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import {Refresh, Search} from "@element-plus/icons-vue";
import {
  api_article_del,
  api_article_list,
  api_tag_list
} from "@/api/api.ts";
import type {ArticleItem, TagItem} from "@/page/article/article.ts";

const router = useRouter();
const tableData = ref<ArticleItem[]>([]);


// 搜索相关
const searchLoading = ref(false);
const tagList = ref<TagItem[]>([]);
const searchForm = reactive({
  title: '',
  tagId: [] as string[],
  status: ''
});

// 分页相关
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case '0':
      return 'info';
    case '1':
      return 'success';
    case '2':
      return 'warning';
    default:
      return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '草稿';
    case 1:
      return '已发布';
    case 2:
      return '已下架';
    default:
      return '未知';
  }
};

// 获取标签列表
const loadTagList = async () => {
  try {
    const {code, data} = await api_tag_list({current: 1, size: 1000});
    if (code === 0) {
      tagList.value = data.records || [];
    }
  } catch (error) {
    console.error('获取标签列表失败:', error);
  }
};

// 获取博客列表
const loadArticleList = async (params = {}) => {
  try {
    const requestParams = {
      current: pagination.current,
      size: pagination.size,
      ...params
    };
    const {code, data} = await api_article_list(requestParams);
    if (code === 0) {
      const records = data.records || [];
      tableData.value = records.map((article: any) => {
        return {
          ...article,
          articleId: article.articleId ? article.articleId.toString() : '',
          tagList: Array.isArray(article.tagList) ? article.tagList : [],
          tags: Array.isArray(article.tags) ? article.tags : []
        };
      });
      pagination.total = data.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取博客列表失败');
  }
};

// 处理每页显示数量变化
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadArticleList();
};

// 处理当前页变化
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadArticleList();
};

// 搜索博客
const handleSearch = async () => {
  searchLoading.value = true;
  try {
    pagination.current = 1;
    const params = {
      title: searchForm.title.trim(),
      tagId: searchForm.tagId,
      status: searchForm.status
    };
    await loadArticleList(params);
  } catch (error) {
  } finally {
    searchLoading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  searchForm.title = '';
  searchForm.tagId = [];
  searchForm.status = '';
  pagination.current = 1;
  loadArticleList();
};

// 新增博客
const handleAddArticle = () => {
  router.push('/blog/article/add');
};

// 编辑博客
const handleEditArticle = (row: ArticleItem) => {
  router.push(`/blog/article/edit/${row.articleId}`);
};

// 删除博客
const handleDeleteArticle = async (row: ArticleItem) => {
  try {
    const {data} = await api_article_del(row.articleId?.toString() || '');
    if (data) {
      ElMessage.success("删除博客成功");
    }
    await loadArticleList();
  } catch (error) {
    ElMessage.error('删除博客失败');
  }
};

onMounted(async () => {
  await loadTagList();
  await loadArticleList();
});
</script>

<style scoped>
.article-management {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.search-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-area .el-form-item {
  margin-bottom: 0;
  margin-right: 20px;
}

.search-area .el-form-item:last-child {
  margin-right: 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
}


</style>
