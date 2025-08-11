<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户昵称">
          <el-input
              v-model="searchForm.nickname"
              placeholder="请输入用户昵称"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
              v-model="searchForm.email"
              placeholder="请输入邮箱"
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
          <el-button type="primary" @click="handleAddUser">新增用户</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="userId" label="用户ID" min-width="180" show-overflow-tooltip/>
      <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip/>
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip/>
      <el-table-column prop="profilePhoto" label="头像" min-width="100" align="center">
        <template #default="scope">
          <el-avatar v-if="scope.row.profilePhoto" :src="scope.row.profilePhoto" :size="40"/>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="userStatus" label="状态" min-width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.userStatus === '0' ? 'success' : 'danger'" size="small">
            {{ scope.row.userStatus === '0' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="160" show-overflow-tooltip/>
      <el-table-column prop="updateTime" label="更新时间" min-width="160" show-overflow-tooltip/>
      <el-table-column label="操作" min-width="150" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEditUser(scope.row)">编辑</el-button>
          <el-popconfirm
              title="确定要删除这个用户吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDeleteUser(scope.row)"
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

    <!-- 编辑用户弹窗 -->
    <el-dialog
        v-model="editDialogVisible"
        :title="isEdit ? '编辑用户' : '新增用户'"
        :width="isMobile ? '90%' : '500px'"
        :close-on-click-modal="false"
        class="user-dialog"
    >
      <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editFormRules"
          label-width="100px"
      >
        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入用户昵称"/>
        </el-form-item>
        <el-form-item label="用户密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            :placeholder="isEdit ? '不修改请留空' : '请输入用户密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="用户邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入用户邮箱"/>
        </el-form-item>
        <el-form-item label="用户头像" prop="profilePhoto">
          <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              action="#"
              :http-request="customUpload"
          >
            <img v-if="editForm.profilePhoto" :src="editForm.profilePhoto" class="avatar"/>
            <el-icon v-else class="avatar-uploader-icon">
              <Plus/>
            </el-icon>
          </el-upload>
          <div class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 2MB</div>
        </el-form-item>

        <el-form-item label="用户状态" prop="userStatus">
          <el-radio-group v-model="editForm.userStatus">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveUser" :loading="saveLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from "vue";
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import {Plus, Refresh, Search} from "@element-plus/icons-vue";
import {api_user_del, api_user_edit, api_user_list, api_user_save} from "@/api/api.ts";
import type {UserItem} from "@/page/user/user.ts";

const tableData = ref<UserItem[]>([]);
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
  nickname: '',
  email: ''
});

// 分页相关
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});


// 编辑表单
const editForm = reactive({
  userId: '' as string | number,
  nickname: '',
  password: '' as string | undefined,
  email: '' as string | null,
  profilePhoto: '' as string | null,
  userStatus: '0'
});

// 表单验证规则
const editFormRules = computed<FormRules>(() => ({
  nickname: [
    {required: true, message: '请输入用户昵称', trigger: 'blur'},
    {min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur'}
  ],
  password: [
    // 新增用户时密码必填，编辑用户时密码可选
    {required: !isEdit.value, message: '请输入用户密码', trigger: 'blur'},
    {min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur'}
  ],
  email: [
    {required: false, message: '请输入邮箱地址', trigger: 'blur'},
    {type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur'}
  ],
  userStatus: [
    {required: true, message: '请选择用户状态', trigger: 'change'}
  ]
}));

// 获取用户列表
const loadUserList = async (params = {}) => {
  try {
    const requestParams = {
      current: pagination.current,
      size: pagination.size,
      ...params
    };
    const {code, data} = await api_user_list(requestParams);
    if (code === 0) {
      // 处理数据，确保 userId 以字符串形式存储
      const records = data.records || [];

      tableData.value = records.map((user: any) => {
        return {
          ...user,
          userId: user.userId ? user.userId.toString() : ''
        };
      });

      pagination.total = data.total || 0;
    } else {
      ElMessage.error('获取用户列表失败');
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  }
};

// 处理每页显示数量变化
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1; // 重置到第一页
  loadUserList();
};

// 处理当前页变化
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadUserList();
};

// 搜索用户
const handleSearch = async () => {
  searchLoading.value = true;
  try {
    pagination.current = 1; // 搜索时重置到第一页
    const params = {
      nickname: searchForm.nickname.trim(),
      email: searchForm.email.trim()
    };
    await loadUserList(params);
  } catch (error) {
  } finally {
    searchLoading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  searchForm.nickname = '';
  searchForm.email = '';
  pagination.current = 1; // 重置时回到第一页
  loadUserList();
};

// 新增用户
const handleAddUser = () => {
  isEdit.value = false;
  resetEditForm();
  editDialogVisible.value = true;
};

// 编辑用户
const handleEditUser = async (row: UserItem) => {
  isEdit.value = true;
  editForm.userId = row.userId || '';
  editForm.nickname = row.nickname;
  editForm.password = ''; // 编辑时不显示密码
  editForm.email = row.email;
  editForm.profilePhoto = row.profilePhoto;
  editForm.userStatus = row.userStatus;
  editDialogVisible.value = true;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.userId = '';
  editForm.nickname = '';
  editForm.password = '';
  editForm.email = null;
  editForm.profilePhoto = null;
  editForm.userStatus = '0';
  editFormRef.value?.clearValidate();
};

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  editForm.profilePhoto = response.url;
  ElMessage.success('头像上传成功');
};

// 头像上传前验证
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg';
  const isPNG = file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 自定义上传
const customUpload = async (options: any) => {
  try {
    // 这里应该调用实际的上传API
    // 目前模拟上传成功
    const file = options.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      editForm.profilePhoto = result;
      ElMessage.success('头像上传成功');
    };
    reader.readAsDataURL(file);
  } catch (error) {
    ElMessage.error('头像上传失败');
  }
};

// 保存用户
const handleSaveUser = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();
    saveLoading.value = true;

    // 准备提交的数据
    const submitData = { ...editForm };

    // 编辑时如果密码为空，则不传递密码字段
    if (isEdit.value && !submitData.password) {
      submitData.password = undefined;
    }
    if (isEdit.value) {
      const {data} = await api_user_edit(submitData)
      if (data) {
        ElMessage.success("编辑用户成功");
      } else {
        ElMessage.error("编辑用户失败");
      }
    } else {
      const {data} = await api_user_save(submitData);
      if (data) {
        ElMessage.success("新增用户成功");
      } else {
        ElMessage.error("新增用户失败");
      }
    }
    editDialogVisible.value = false;
    await loadUserList();
  } catch (error) {
  } finally {
    saveLoading.value = false;
  }
};

// 删除用户
const handleDeleteUser = async (row: UserItem) => {
  try {
    const {data} = await api_user_del(row.userId?.toString() || '');
    if (data) {
      ElMessage.success("删除用户成功");
    }
    await loadUserList(); // 重新加载列表
  } catch (error) {
    ElMessage.error('删除用户失败');
  }
};

onMounted(() => {
  checkScreenSize(); // 初始化屏幕尺寸检测
  loadUserList();
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
