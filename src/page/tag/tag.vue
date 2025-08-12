<template>
  <div class="user-management">
    <div class="page-header">
      <h2>标签管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="标签名称">
          <el-input
              v-model="searchForm.tagName"
              placeholder="请输入标签名称"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
          />
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
          <el-button type="primary" @click="handleAddTag">新增标签</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="tagId" label="标签ID" min-width="180" show-overflow-tooltip/>
      <el-table-column prop="tagName" label="标签名称" min-width="120" show-overflow-tooltip/>
      <el-table-column prop="tagType" label="标签类型" min-width="120" show-overflow-tooltip/>
      <el-table-column label="操作" min-width="150" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEditTag(scope.row)">编辑</el-button>
          <el-popconfirm
              title="确定要删除这个标签吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDeleteTag(scope.row)"
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
          :layout="isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="responsive-pagination"
      />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
        v-model="editDialogVisible"
        :title="isEdit ? '编辑标签' : '新增标签'"
        :width="isMobile ? '90%' : '500px'"
        :close-on-click-modal="false"
        class="user-dialog"
    >
      <el-form
          ref="editFormRef"
          :model="editForm"
          label-width="100px"
      >
        <el-form-item label="标签名称" prop="nickname">
          <el-input v-model="editForm.tagName" placeholder="请输入标签名称"/>
        </el-form-item>
        <el-form-item label="标签类型" prop="nickname">
          <el-input v-model="editForm.tagType" placeholder="请输入标签类型"/>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTag" :loading="saveLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import {ElMessage, type FormInstance} from "element-plus";
import {Refresh, Search} from "@element-plus/icons-vue";
import {api_tag_del, api_tag_edit, api_tag_list, api_tag_save} from "@/api/api.ts";
import type {TagItem} from "@/page/tag/tag.ts";

const tableData = ref<TagItem[]>([]);
const editFormRef = ref<FormInstance>();

// 响应式检测
const isMobile = ref(false);

// 检测屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

// 监听窗口大小变化
window.addEventListener('resize', checkScreenSize);


// 弹窗相关
const editDialogVisible = ref(false);
const isEdit = ref(false);
const saveLoading = ref(false);

// 搜索相关
const searchLoading = ref(false);
const searchForm = reactive({
  tagName: '',
});

// 分页相关
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});


// 编辑表单
const editForm = reactive({
  tagId: '' as string | number,
  tagName: '',
  tagType: '',
});


// 获取列表
const loadTagList = async (params = {}) => {
  try {
    const requestParams = {
      current: pagination.current,
      size: pagination.size,
      ...params
    };
    const {code, data} = await api_tag_list(requestParams);
    if (code === 0) {
      tableData.value = data.records || []
      pagination.total = data.total || 0;
    } else {
      ElMessage.error('获取标签列表失败');
    }
  } catch (error) {
    ElMessage.error('获取标签列表失败');
  }
};

// 处理每页显示数量变化
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1; // 重置到第一页
  loadTagList();
};

// 处理当前页变化
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadTagList();
};

// 搜索
const handleSearch = async () => {
  searchLoading.value = true;
  try {
    pagination.current = 1; // 搜索时重置到第一页
    const params = {
      tagName: searchForm.tagName.trim()
    };
    await loadTagList(params);
  } catch (error) {
  } finally {
    searchLoading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  searchForm.tagName = '';
  pagination.current = 1; // 重置时回到第一页
  loadTagList();
};

// 新增标签
const handleAddTag = () => {
  isEdit.value = false;
  resetEditForm();
  editDialogVisible.value = true;
};

// 编辑标签
const handleEditTag = async (row: TagItem) => {
  isEdit.value = true;
  editForm.tagId = row.tagId || '';
  editForm.tagName = row.tagName;
  editForm.tagType = row.tagType;
  editDialogVisible.value = true;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.tagId = '';
  editForm.tagName = '';
  editForm.tagType = '';
  editFormRef.value?.clearValidate();
};


// 保存
const handleSaveTag = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();
    saveLoading.value = true;

    // 准备提交的数据
    const submitData = { ...editForm };

    if (isEdit.value) {
      const {data} = await api_tag_edit(submitData)
      if (data) {
        ElMessage.success("编辑标签成功");
      } else {
        ElMessage.error("编辑标签失败");
      }
    } else {
      const {data} = await api_tag_save(submitData);
      if (data) {
        ElMessage.success("新增标签成功");
      } else {
        ElMessage.error("新增标签失败");
      }
    }
    editDialogVisible.value = false;
    await loadTagList();
  } catch (error) {
  } finally {
    saveLoading.value = false;
  }
};

// 删除
const handleDeleteTag = async (row: TagItem) => {
  try {
    const {data} = await api_tag_del(row.tagId?.toString() || '');
    if (data) {
      ElMessage.success("删除标签成功");
    }
    await loadTagList(); // 重新加载列表
  } catch (error) {
    ElMessage.error('删除标签失败');
  }
};

onMounted(() => {
  checkScreenSize(); // 初始化屏幕尺寸检测
  loadTagList();
});
</script>


<style scoped>
.user-management {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

/* 移动端整体样式 */
@media (max-width: 768px) {
  .user-management {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .page-header h2 {
    font-size: 20px;
  }
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

/* 移动端样式 */
@media (max-width: 768px) {
  .search-area {
    padding: 16px;
  }

  .search-area .el-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-area .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .search-area .el-form-item:last-child {
    margin-bottom: 0;
  }

  .search-area .el-input {
    width: 100% !important;
  }

  .search-area .el-button {
    margin-right: 8px;
  }

  .search-area .el-button:last-child {
    margin-right: 0;
  }
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

.responsive-pagination {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

/* 移动端分页样式 */
@media (max-width: 768px) {
  .pagination-container {
    padding: 16px;
  }

  .responsive-pagination .el-pagination {
    font-size: 14px;
  }

  .responsive-pagination .el-pagination .el-pager li {
    min-width: 32px;
    height: 32px;
    line-height: 32px;
  }
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

/* 移动端表格样式 */
@media (max-width: 768px) {
  .el-table {
    font-size: 14px;
  }

  .el-table .el-table__header-wrapper {
    display: none;
  }

  .el-table .el-table__body-wrapper .el-table__row {
    display: block;
    border: 1px solid #ebeef5;
    margin-bottom: 8px;
    border-radius: 4px;
    padding: 12px;
  }

  .el-table .el-table__body-wrapper .el-table__cell {
    display: block;
    border: none;
    padding: 4px 0;
    text-align: left;
  }

  .el-table .el-table__body-wrapper .el-table__cell::before {
    content: attr(data-label) ": ";
    font-weight: bold;
    color: #606266;
  }

  .el-table .el-table__body-wrapper .el-table__cell:last-child {
    border-top: 1px solid #ebeef5;
    margin-top: 8px;
    padding-top: 8px;
  }
}

.el-avatar {
  width: 40px;
  height: 40px;
}

/* 头像上传样式 */
.avatar-uploader {
  text-align: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: center;
}

/* 弹窗样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.user-dialog .el-dialog__body {
  padding: 20px;
}

/* 移动端弹窗样式 */
@media (max-width: 768px) {
  .user-dialog .el-dialog__body {
    padding: 16px;
  }

  .user-dialog .el-form-item {
    margin-bottom: 16px;
  }

  .user-dialog .el-form-item__label {
    line-height: 1.4;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}
</style>
