import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/index' },
  { path: '/index', name: 'index', component: () => import('@/views/index.vue'), meta: { title: 'AI总览首页', icon: '🏠' } },
  { path: '/medicine', name: 'medicine', component: () => import('@/views/medicine.vue'), meta: { title: '服药管家', icon: '💊' } },
  { path: '/report', name: 'report', component: () => import('@/views/report.vue'), meta: { title: '体检报告AI解读', icon: '🩺' } },
  { path: '/sign', name: 'sign', component: () => import('@/views/sign.vue'), meta: { title: '居家体征看板', icon: '❤️' } },
  { path: '/child', name: 'child', component: () => import('@/views/child.vue'), meta: { title: '子女关怀', icon: '👨‍👩‍👧' } },
  { path: '/popular', name: 'popular', component: () => import('@/views/popular.vue'), meta: { title: 'AI精准科普', icon: '📚' } }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export const menuRoutes = routes.filter(r => r.name && r.name !== 'index')
