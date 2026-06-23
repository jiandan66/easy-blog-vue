<template>
  <div class="main-layout">
    <!-- 左侧菜单栏 -->
    <div class="sidebar" :class="{
      collapsed: isCollapsed && !isMobile,
      'mobile-sidebar': isMobile,
      'mobile-show': showMobileSidebar
    }">
      <div class="sidebar-header">
        <div class="header-content">
          <h2 v-if="!isCollapsed">Easy Blog</h2>
          <h2 v-else>EB</h2>
          <!-- 折叠按钮 -->
          <div class="sidebar-toggle" @click="toggleSidebar">
            <el-icon>
              <component :is="isCollapsed ? 'ArrowRight' : 'ArrowLeft'"></component>
            </el-icon>
          </div>
        </div>
      </div>

      <div class="sidebar-menu">
        <div
          v-for="menu in menuList"
          :key="menu.id"
          class="menu-item"
          :class="{ active: activeMenu === menu.id }"
          :data-title="menu.name"
          @click="handleMenuClick(menu)"
        >
          <div class="menu-content">
            <el-icon v-if="menu.icon" class="menu-icon">
              <component :is="menu.icon"></component>
            </el-icon>
            <span v-if="!isCollapsed" class="menu-text">{{ menu.name }}</span>
            <el-icon
              v-if="menu.list && menu.list.length > 0 && !isCollapsed"
              class="arrow-icon"
              :class="{ 'arrow-down': expandedMenus.includes(menu.id) }"
            >
              <ArrowDown />
            </el-icon>
          </div>

          <!-- 子菜单 -->
          <div
            v-if="menu.list && menu.list.length > 0 && !isCollapsed"
            class="submenu"
            :class="{ 'submenu-expanded': expandedMenus.includes(menu.id) }"
          >
            <div
              v-for="submenu in menu.list"
              :key="submenu.id"
              class="submenu-item"
              :class="{ active: activeSubmenu === submenu.id }"
              @click.stop="handleSubmenuClick(submenu)"
            >
              <el-icon v-if="submenu.icon" class="submenu-icon">
                <component :is="submenu.icon"></component>
              </el-icon>
              <span>{{ submenu.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <div class="top-navbar">
        <div class="navbar-left">
          <el-icon class="menu-toggle" @click="toggleSidebar">
            <Menu />
          </el-icon>
          <h1>{{ currentPageTitle }}</h1>
        </div>
        <div class="navbar-right">
          <div class="user-info">
            <el-icon class="user-icon">
              <User />
            </el-icon>
            <span>{{ userName }}</span>
            <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <router-view />
      </div>
    </div>

    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && showMobileSidebar"
      class="mobile-overlay"
      @click="closeMobileSidebar"
    ></div>

    <!-- 水印 -->
    <div class="watermark" v-if="showWatermark">
      <div
        v-for="i in 120"
        :key="i"
        class="watermark-item"
        :style="{
          left: `${(i % 12) * 8.33}%`,
          top: `${Math.floor(i / 12) * 10}%`
        }"
      >
        {{ watermarkText }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, ArrowRight, ArrowLeft, Menu, User, House, Setting, Tools, Document, Picture, Tickets, Menu as MenuIcon } from '@element-plus/icons-vue'

const router = useRouter()

// 菜单状态
const isCollapsed = ref(false)
const activeMenu = ref<number | null>(null)
const activeSubmenu = ref<number | null>(null)
const expandedMenus = ref<number[]>([])

// 移动端侧边栏状态
const isMobile = ref(false)
const showMobileSidebar = ref(false)

// 用户信息
const userName = ref('admin')
const menuList = ref<any[]>([])

// 水印设置
const showWatermark = ref(true)
const watermarkText = computed(() => {
  return userName.value || 'Easy Blog'
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentRoute = router.currentRoute.value
  // 这里可以根据路由返回对应的页面标题
  return '首页'
})

// 检测是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 切换侧边栏
const toggleSidebar = (() => {
  let isAnimating = false
  
  return () => {
    // 添加防抖，避免快速点击
    if (isAnimating) return
    isAnimating = true

    if (isMobile.value) {
      // 移动端：切换移动端侧边栏显示
      showMobileSidebar.value = !showMobileSidebar.value
    } else {
      // 桌面端：切换折叠状态
      isCollapsed.value = !isCollapsed.value
    }

    setTimeout(() => {
      isAnimating = false
    }, 200)
  }
})()

// 关闭移动端侧边栏
const closeMobileSidebar = () => {
  showMobileSidebar.value = false
}

// 处理菜单点击
const handleMenuClick = (() => {
  let isProcessing = false
  
  return (menu: any) => {
    // 添加防抖
    if (isProcessing) return
    isProcessing = true

    if (menu.list && menu.list.length > 0) {
      // 有子菜单，切换展开状态
      const index = expandedMenus.value.indexOf(menu.id)
      if (index > -1) {
        // 如果已经展开，则收起
        expandedMenus.value.splice(index, 1)
        activeMenu.value = null
        activeSubmenu.value = null
      } else {
        // 如果未展开，则只展开菜单，不自动跳转
        expandedMenus.value.push(menu.id)
        activeMenu.value = menu.id
        activeSubmenu.value = null
      }
    } else if (menu.url) {
      // 没有子菜单，直接跳转
      activeMenu.value = menu.id
      activeSubmenu.value = null
      router.push(menu.url)
      // 移动端：点击后关闭侧边栏
      if (isMobile.value) {
        closeMobileSidebar()
      }
    }

    setTimeout(() => {
      isProcessing = false
    }, 100)
  }
})()

// 处理子菜单点击
const handleSubmenuClick = (() => {
  let isProcessing = false
  
  return (submenu: any) => {
    // 添加防抖
    if (isProcessing) return
    isProcessing = true

    activeSubmenu.value = submenu.id
    if (submenu.url) {
      router.push(submenu.url)
      // 移动端：点击后关闭侧边栏
      if (isMobile.value) {
        closeMobileSidebar()
      }
    }

    setTimeout(() => {
      isProcessing = false
    }, 100)
  }
})()

// 处理退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}

// 递归过滤掉按钮类型(type=2)的菜单
const filterMenuTree = (menus: any[]): any[] => {
  return menus
    .filter((menu: any) => menu.type !== 2)
    .map((menu: any) => ({
      ...menu,
      list: menu.list ? filterMenuTree(menu.list) : []
    }));
};

// 初始化菜单数据
const initMenuData = () => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const data = JSON.parse(userInfo)
      userName.value = data.userName || 'admin'
      menuList.value = filterMenuTree(data.menuList || [])
    } catch (error) {
      console.error('解析用户信息失败:', error)
      userName.value = 'admin'
      menuList.value = []
    }
  } else {
    // 如果没有用户信息，设置为默认值
    userName.value = 'admin'
    menuList.value = []
  }
}

// 根据当前路由设置选中状态
const setActiveMenuByRoute = () => {
  const currentRoute = router.currentRoute.value.path

  // 重置选中状态
  activeMenu.value = null
  activeSubmenu.value = null

  // 遍历菜单列表，找到匹配的路由
  for (const menu of menuList.value) {
    if (menu.url === currentRoute) {
      // 直接匹配的菜单项
      activeMenu.value = menu.id
      break
    } else if (menu.list && menu.list.length > 0) {
      // 检查子菜单
      for (const submenu of menu.list) {
        if (submenu.url === currentRoute) {
          activeMenu.value = menu.id
          activeSubmenu.value = submenu.id
          // 确保父菜单展开
          if (!expandedMenus.value.includes(menu.id)) {
            expandedMenus.value.push(menu.id)
          }
          break
        }
      }
      if (activeSubmenu.value) break
    }
  }
}

// 监听路由变化
watch(() => router.currentRoute.value.path, () => {
  setActiveMenuByRoute()
}, { immediate: true })

// 监听菜单数据变化
watch(menuList, () => {
  setActiveMenuByRoute()
}, { deep: true })

onMounted(() => {
  initMenuData()
  // 初始化后设置选中状态
  setActiveMenuByRoute()

  // 检测移动端
  checkMobile()

  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  will-change: width;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar.collapsed .menu-content {
  justify-content: center;
  padding: 10px 6px;
}

.sidebar.collapsed .menu-icon {
  margin-right: 0;
  font-size: 20px;
}

.sidebar.collapsed .menu-text,
.sidebar.collapsed .arrow-icon {
  display: none;
}

.sidebar.collapsed .submenu {
  display: none;
}

/* 折叠时的工具提示 */
.sidebar.collapsed .menu-item {
  position: relative;
}

.sidebar.collapsed .menu-item:hover::after {
  content: attr(data-title);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1001;
  margin-left: 8px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  color: white;
}

.sidebar-menu {
  padding: 16px 0;
  overflow-y: auto;
  height: calc(100vh - 140px);
}

.menu-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
  margin: 2px 6px;
  border-radius: 6px;
  will-change: background-color;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.menu-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  font-size: 14px;
  min-height: 40px;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.menu-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  margin-left: 8px;
  will-change: transform;
}

.arrow-down {
  transform: rotate(180deg);
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(0, 0, 0, 0.1);
  margin: 0 6px;
  border-radius: 0 0 6px 6px;
  will-change: max-height;
}

.submenu-expanded {
  max-height: 300px;
}

.submenu-item {
  padding: 8px 14px 8px 44px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  min-height: 36px;
}

.submenu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submenu-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.submenu-icon {
  font-size: 14px;
  margin-right: 8px;
  flex-shrink: 0;
}

.sidebar-toggle {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  will-change: background-color, transform;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.sidebar-toggle .el-icon {
  font-size: 12px;
  color: white;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;
}

.top-navbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.menu-toggle:hover {
  color: #409eff;
}

.navbar-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-icon {
  font-size: 16px;
  color: #666;
}

.user-info span {
  font-weight: 500;
  color: #333;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}

/* 水印样式 */
.watermark {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.watermark-item {
  position: absolute;
  color: rgba(0, 0, 0, 0.1);
  font-size: 18px;
  font-weight: normal;
  white-space: nowrap;
  user-select: none;
  transform: rotate(-45deg);
  opacity: 0.6;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.08);
  letter-spacing: 0.3px;
}

/* 移动端遮罩层 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .sidebar.mobile-show {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  /* 移动端侧边栏样式调整 */
  .sidebar.mobile-sidebar {
    width: 280px !important;
  }

  .sidebar.mobile-sidebar.collapsed {
    width: 280px !important;
  }

  .sidebar.mobile-sidebar .menu-content {
    justify-content: flex-start;
    padding: 12px 16px;
  }

  .sidebar.mobile-sidebar .menu-text {
    display: block !important;
  }

  .sidebar.mobile-sidebar .arrow-icon {
    display: block !important;
  }

  .sidebar.mobile-sidebar .submenu {
    display: block !important;
  }
}


</style>
