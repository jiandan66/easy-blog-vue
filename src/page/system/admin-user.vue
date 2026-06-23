<template>
  <div class="admin-user-management">
    <div class="page-header">
      <h2>后管用户管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input
              v-model="searchForm.userName"
              placeholder="请输入用户名"
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="0"/>
            <el-option label="禁用" :value="1"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searchLoading">
            <el-icon><Search/></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh/></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="handleAddUser">新增用户</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="id" label="用户ID" min-width="80" show-overflow-tooltip/>
      <el-table-column prop="userName" label="用户名" min-width="120" show-overflow-tooltip/>
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip/>
      <el-table-column label="用户类型" min-width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.userType === 0 ? 'primary' : 'info'" size="small">
            {{ scope.row.userType === 0 ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.userStatus === 0 ? 'success' : 'danger'" size="small">
            {{ scope.row.userStatus === 0 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录" min-width="160" show-overflow-tooltip/>
      <el-table-column label="操作" min-width="280" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" type="warning" :disabled="scope.row.userType === 0" @click="handleAllotMenu(scope.row)">权限分配</el-button>
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
    >
      <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editFormRules"
          label-width="100px"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="editForm.userName" placeholder="请输入用户名"/>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱"/>
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-radio-group v-model="editForm.userType">
            <el-radio :label="0">管理员</el-radio>
            <el-radio :label="1">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="userStatus">
          <el-radio-group v-model="editForm.userStatus">
            <el-radio :label="0">正常</el-radio>
            <el-radio :label="1">禁用</el-radio>
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

    <!-- 权限分配弹窗 -->
    <el-dialog
        v-model="allotMenuDialogVisible"
        title="权限分配"
        :width="isMobile ? '90%' : '500px'"
        :close-on-click-modal="false"
    >
      <div v-loading="allotMenuLoading" style="min-height: 200px">
        <div style="margin-bottom: 12px; color: #909399; font-size: 14px;">
          当前用户：<strong>{{ currentUserName }}</strong>
        </div>
        <el-tree
            ref="menuTreeRef"
            :data="menuTreeData"
            :props="menuTreeProps"
            show-checkbox
            node-key="id"
            default-expand-all
            :check-strictly="false"
            highlight-current
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="allotMenuDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveAllotMenu" :loading="saveAllotLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, reactive, ref} from "vue";
import {ElMessage, type FormInstance, type FormRules} from "element-plus";
import {Plus, Refresh, Search} from "@element-plus/icons-vue";
import {
  api_admin_user_list,
  api_admin_user_save_or_update,
  api_menu_list,
  api_user_menu_allot,
  api_user_menu_list
} from "@/api/api.ts";
import type {AdminUserItem} from "@/page/system/admin-user.ts";
import type {MenuItem} from "@/page/system/menu.ts";

const tableData = ref<AdminUserItem[]>([]);
const editFormRef = ref<FormInstance>();

// 响应式检测
const isMobile = ref(false);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

window.addEventListener('resize', checkScreenSize);

// 弹窗相关
const editDialogVisible = ref(false);
const isEdit = ref(false);
const saveLoading = ref(false);

// 搜索相关
const searchLoading = ref(false);
const searchForm = reactive({
  userName: '',
  email: '',
  status: null as number | null
});

// 分页相关
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// 编辑表单
const editForm = reactive({
  id: '' as string | number,
  userName: '',
  password: '' as string | undefined,
  email: '' as string | null,
  userType: 0 as number,
  userStatus: 0 as number
});

// 表单验证规则
const editFormRules = computed<FormRules>(() => ({
  userName: [
    {required: true, message: '请输入用户名', trigger: 'blur'},
    {min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur'}
  ],
  password: [
    {required: !isEdit.value, message: '请输入密码', trigger: 'blur'},
    {min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur'}
  ]
}));

// 获取用户列表
const loadUserList = async (searchParams?: { userName?: string; email?: string; status?: number | null }) => {
  try {
    const requestParams = {
      status: searchParams?.status ?? null,
      userName: searchParams?.userName ?? '',
      email: searchParams?.email ?? '',
      current: pagination.current,
      size: pagination.size,
    };
    const {code, data} = await api_admin_user_list(requestParams);
    if (code === 0) {
      tableData.value = data.records || [];
      pagination.total = data.total || 0;
    } else {
      ElMessage.error('获取用户列表失败');
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  }
};

const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadUserList({
    userName: searchForm.userName.trim(),
    email: searchForm.email.trim(),
    status: searchForm.status
  });
};

const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadUserList({
    userName: searchForm.userName.trim(),
    email: searchForm.email.trim(),
    status: searchForm.status
  });
};

const handleSearch = async () => {
  searchLoading.value = true;
  try {
    pagination.current = 1;
    await loadUserList({
      userName: searchForm.userName.trim(),
      email: searchForm.email.trim(),
      status: searchForm.status
    });
  } catch (error) {
  } finally {
    searchLoading.value = false;
  }
};

const handleReset = () => {
  searchForm.userName = '';
  searchForm.email = '';
  searchForm.status = null;
  pagination.current = 1;
  loadUserList();
};

const handleAddUser = () => {
  isEdit.value = false;
  resetEditForm();
  editDialogVisible.value = true;
};

const handleEditUser = async (row: AdminUserItem) => {
  isEdit.value = true;
  editForm.id = row.id || '';
  editForm.userName = row.userName;
  editForm.password = '';
  editForm.email = row.email;
  editForm.userType = row.userType;
  editForm.userStatus = row.userStatus;
  editDialogVisible.value = true;
};

const resetEditForm = () => {
  editForm.id = '';
  editForm.userName = '';
  editForm.password = '';
  editForm.email = null;
  editForm.userType = 0;
  editForm.userStatus = 0;
  editFormRef.value?.clearValidate();
};

// 保存用户
const handleSaveUser = async () => {
  if (!editFormRef.value) return;

  try {
    await editFormRef.value.validate();
    saveLoading.value = true;

    const submitData: Record<string, any> = { ...editForm };
    if (isEdit.value && !submitData.password) {
      delete submitData.password;
    }
    // 新增时无id，删除id字段
    if (!submitData.id) {
      delete submitData.id;
    }

    const {code} = await api_admin_user_save_or_update(submitData);
    if (code === 0) {
      ElMessage.success(isEdit.value ? "编辑用户成功" : "新增用户成功");
      editDialogVisible.value = false;
      await loadUserList();
    } else {
      ElMessage.error(isEdit.value ? "编辑用户失败" : "新增用户失败");
    }
  } catch (error) {
  } finally {
    saveLoading.value = false;
  }
};

// 删除用户
const handleDeleteUser = async (row: AdminUserItem) => {
  try {
    ElMessage.success("删除用户成功");
    await loadUserList();
  } catch (error) {
    ElMessage.error('删除用户失败');
  }
};

// ========== 权限分配 ==========
const allotMenuDialogVisible = ref(false);
const allotMenuLoading = ref(false);
const saveAllotLoading = ref(false);
const menuTreeRef = ref();
const menuTreeData = ref<MenuItem[]>([]);
const currentUserId = ref('');
const currentUserName = ref('');

const menuTreeProps = {
  value: 'id',
  label: 'name',
  children: 'list',
};

// 打开权限分配弹窗
const handleAllotMenu = async (row: AdminUserItem) => {
  currentUserId.value = row.id?.toString() || '';
  currentUserName.value = row.userName;
  allotMenuDialogVisible.value = true;
  allotMenuLoading.value = true;

  try {
    // 并行加载所有菜单和用户已有的菜单权限
    const [menuRes, userMenuRes] = await Promise.all([
      api_menu_list(),
      api_user_menu_list(currentUserId.value)
    ]);

    // 处理菜单树
    if (menuRes.code === 0) {
      menuTreeData.value = menuRes.data || [];
    } else {
      ElMessage.error('获取菜单列表失败');
    }

    // 设置用户已有的菜单权限
    if (userMenuRes.code === 0) {
      // 递归提取所有菜单ID（包括嵌套的子菜单）
      const extractIds = (menus: any[]): string[] => {
        const ids: string[] = [];
        for (const menu of menus) {
          if (menu.id != null) ids.push(menu.id.toString());
          if (menu.list && menu.list.length > 0) ids.push(...extractIds(menu.list));
        }
        return ids;
      };
      const userMenuIds = extractIds(userMenuRes.userMenuList || []);
      await nextTick();
      menuTreeRef.value?.setCheckedKeys(userMenuIds, false);
    } else {
      ElMessage.error('获取用户菜单权限失败');
    }
  } catch (error) {
    ElMessage.error('加载菜单数据失败');
  } finally {
    allotMenuLoading.value = false;
  }
};

// 保存权限分配
const handleSaveAllotMenu = async () => {
  if (!menuTreeRef.value) return;

  saveAllotLoading.value = true;
  try {
    const checkedKeys = menuTreeRef.value.getCheckedKeys();
    const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys();
    const menuIdList = [...checkedKeys, ...halfCheckedKeys];

    const {code} = await api_user_menu_allot({
      userId: currentUserId.value,
      menuIdList: menuIdList
    });

    if (code === 0) {
      ElMessage.success('权限分配成功');
      allotMenuDialogVisible.value = false;
    } else {
      ElMessage.error('权限分配失败');
    }
  } catch (error) {
    ElMessage.error('权限分配失败');
  } finally {
    saveAllotLoading.value = false;
  }
};

onMounted(() => {
  checkScreenSize();
  loadUserList();
});
</script>


<style scoped>
.admin-user-management {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .admin-user-management {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}
</style>
