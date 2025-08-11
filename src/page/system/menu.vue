<template>
  <el-button @click="saveOrUpdateMenu(null, 'add')">新增菜单</el-button>
  <div>
    <el-table
        :data="menuList"
        style="width: 100%; margin-bottom: 20px"
        row-key="id"
        border
        :tree-props="{ children: 'list', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="name" label="菜单名称" header-align="center" align="center" width="200px"/>
      <el-table-column label="图标" header-align="center" align="center" width="80px">
        <template #default="{ row }">
          <el-icon v-if="row.icon && isValidIcon(row.icon)">
            <component :is="row.icon"></component>
          </el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" header-align="center" align="center" width="80px"/>
      <el-table-column prop="perms" label="权限" header-align="center" align="center" width="300px"/>
      <el-table-column prop="url" label="组件路径" header-align="center" align="center" width="200px"/>
      <el-table-column label="类型" header-align="center" align="center" width="80px">
        <template #default="{ row }">
          <el-tag>{{ getTypeName(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" header-align="center" align="center">
        <template #default="{ row }">
          <el-button type="primary" icon="Plus" link @click="saveOrUpdateMenu(row, 'add')">新增</el-button>
          <el-button type="primary" icon="Edit" link @click="saveOrUpdateMenu(row, 'edit')">修改</el-button>
          <el-popconfirm title="您确定要删除吗?" @confirm="deleteMenu(row.id)">
            <template #reference>
              <el-button type="primary" icon="Delete" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
        v-model="saveDialogVisible"
        :title="diaLogTitle"
        width="500px"
    >
      <el-form ref="formRef" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
              v-model="selectedParentId"
              :data="treeSelectData"
              :props="treeSelectProps"
              :placeholder="getParentPlaceholder()"
              check-strictly
              :render-after-expand="false"
              @change="handleTreeSelectChange"
          >
            <template #default="{ data }">
              <span>{{ data.name }}</span>
            </template>
          </el-tree-select>

        </el-form-item>

        <el-form-item label="菜单类型">
          <el-radio-group v-model="menu.type">
            <el-radio :label="0">目录</el-radio>
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单图标">
          <el-input v-model="menu.icon" placeholder="请输入ICON名称"/>
        </el-form-item>

        <el-form-item v-if="menu.type == 1" label="路由地址" required>
          <el-input v-model="menu.url" placeholder="请输入路由地址"/>
        </el-form-item>
        <el-form-item label="权限标识" required>
          <el-input v-model="menu.perms" placeholder="请输入权限标识"/>
        </el-form-item>
        <el-form-item label="显示排序">
          <el-input v-model="menu.sort" placeholder="请输入显示排序" type="number"/>
        </el-form-item>

        <el-form-item label="菜单名称" required>
          <el-input v-model="menu.name" placeholder="请输入菜单名称"/>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="saveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref, computed} from "vue";
import {api_menu_add_or_update, api_menu_delete, api_menu_list} from "@/api/api.ts";
import type {MenuItem} from "@/page/system/menu.ts";
import {ElMessage} from "element-plus";

const menuList = ref<MenuItem[]>([]);

const menu = ref<MenuItem>({
  id: 0,
  parentId: 0,
  name: "",
  perms: "",
  type: 0,
  url: "",
  icon: "",
  sort: 0,
  parentName: "",
  list: [],
});

const saveDialogVisible = ref(false);
const diaLogTitle = ref("新增菜单");
const operationType = ref<'add' | 'edit'>('add');
const selectedParentId = ref<number>(0);

const treeSelectProps = {
  value: 'id',
  label: 'name',
  children: 'list',
};


// 为树形选择器准备数据，添加顶级菜单选项
const treeSelectData = computed(() => {
  const topLevelOption = {
    id: 0,
    name: "顶级菜单",
    list: []
  };
  return [topLevelOption, ...menuList.value];
});

// 获取菜单信息
const getMenuList = async () => {
  const {code, data} = await api_menu_list();
  if (code === 0) {
    menuList.value = data.map((item: MenuItem) => ({
      ...item,
      hasChildren: item.list && item.list.length > 0,
    }));
  }
}

const getTypeName = (type: number) => {
  switch (type) {
    case 0:
      return "目录";
    case 1:
      return "菜单";
    case 2:
      return "按钮";
    default:
      return "未知类型";
  }
};

// 验证图标是否有效
const isValidIcon = (iconName: string | null): boolean => {
  if (!iconName) return false;

  // 常见的 Element Plus 图标列表
  const validIcons = [
    'Setting', 'User', 'Edit', 'Delete', 'Plus', 'Search', 'Refresh', 'Download', 'Upload',
    'View', 'Hide', 'Show', 'Close', 'Check', 'Warning', 'Info', 'Success', 'Error',
    'Home', 'Menu', 'Document', 'Folder', 'Picture', 'Video', 'Audio', 'Link', 'Share',
    'Star', 'Heart', 'Like', 'Dislike', 'Comment', 'Message', 'Notification', 'Bell',
    'Calendar', 'Clock', 'Location', 'Phone', 'Email', 'Lock', 'Unlock', 'Key', 'Shield',
    'Cog', 'Tools', 'Build', 'Repair', 'Maintenance', 'Dashboard', 'Chart', 'Graph',
    'Table', 'List', 'Grid', 'Card', 'Box', 'Container', 'Panel', 'Window', 'Door',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'CaretTop', 'CaretBottom',
    'CaretLeft', 'CaretRight', 'DArrowLeft', 'DArrowRight', 'Expand', 'Fold','Tickets'
  ];

  return validIcons.includes(iconName);
};

const saveOrUpdateMenu = async (row: MenuItem | null, type: 'add' | 'edit') => {
  operationType.value = type;
  diaLogTitle.value = type === 'add' ? "新增菜单" : "修改菜单";
  saveDialogVisible.value = true;

  if (type === 'edit' && row) {
    menu.value = {...row};
    selectedParentId.value = row.parentId;
  } else {
    menu.value = {
      id: 0,
      parentId: row?.id || 0,
      name: "",
      perms: "",
      type: 1,
      url: "",
      icon: "",
      sort: 0,
      parentName: "",
      list: [],
    };
    selectedParentId.value = row?.id || 0;
  }
  await getMenuList();
}

const handleTreeSelectChange = (value: number) => {
  menu.value.parentId = value || 0;
};

const getParentPlaceholder = () => {
  if (selectedParentId.value === 0) {
    return "顶级菜单";
  }
  return "请选择上级菜单";
};

//新增or修改菜单
const handleSave = async () => {
  const {code} = await api_menu_add_or_update(menu.value)
  if (code == 0) {
    ElMessage.success("成功")
  }
  saveDialogVisible.value = false;
  await getMenuList();

};

const deleteMenu = async (row: number) => {
  const {code} = await api_menu_delete(row)
  if (code == 0) {
    ElMessage.success("成功")
    await getMenuList();
  }
}

onMounted(async () => {
  await getMenuList();
});
</script>

<style scoped>
</style>
