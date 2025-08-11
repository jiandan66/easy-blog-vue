import {createRouter, createWebHistory} from 'vue-router'
import type {RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'EasyLogin',
        component: () => import('@/page/login/login.vue')
    },
    {
        path: '/',
        component: () => import('@/layout/MainLayout.vue'),
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('@/page/home/home.vue')
            },
            {
                path: '/blog/system/menu',
                name: 'Menu',
                component: () => import('@/page/system/menu.vue')
            },
            {
                path: '/blog/user/user',
                name: 'User',
                component: () => import('@/page/user/user.vue')
            },
            {
                path: '/blog/tag/list',
                name: 'Tag',
                component: () => import('@/page/tag/tag.vue')
            },
            {
                path: '/blog/system/dict',
                name: 'Dict',
                component: () => import('@/page/system/dict.vue')
            }
        ]
    }
]

//这里我使用的history模式 如果你们用的是hash模式 可以自己切换 createWebHashHistory
const router = createRouter({
    history: createWebHistory('/easy/'),
    routes
})

//路由守卫
router.beforeEach((to, from, next) => {
    // 如果目标路径不是登录页面且没有 token，则重定向到登录页面
    if (!to.path.includes('/login') && !localStorage.getItem('token')) {
        return next('/login');
    }
    // 如果目标路径是登录页面且有 token，则重定向到 "/"
    else if (to.path.includes('/login') && localStorage.getItem('token')) {
        return next('/');
    }
    // 其他情况，继续导航
    else {
        next();
    }
});

export default router
