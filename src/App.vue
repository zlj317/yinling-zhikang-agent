<script setup lang="ts">
// 智康 Agent · 主应用壳
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { menuRoutes } from '@/router'
import { useHealthStore } from '@/stores/health'
import { chineseToday } from '@/utils/storage'

const route = useRoute()
const health = useHealthStore()

// 各模块专属描述文案（用于页面标题下方副标题，区分各模块功能）
const descMap: Record<string, string> = {
  '/index': 'AI 智能总览 · 一眼看懂您今日的健康状态',
  '/medicine': '按时服药提醒 · 不遗漏、不冲突，安心每一天',
  '/report': 'AI 智能解读体检报告 · 通俗易懂，告别看不懂',
  '/sign': '血压/血糖/心率一键记录 · 随时掌握健康走势',
  '/child': '子女关怀面板 · 异地也能守护父母健康',
  '/popular': 'AI 精准健康科普 · 根据您的慢病情况智能推荐'
}

health.checkOverdue()

const currentTitle = computed(() => route.meta?.title || '智康Agent')
const currentDesc = computed(() => descMap[route.path] || '智康Agent · 您身边的健康管家')
</script>

<template>
  <div style="min-height: 100vh; display: flex;">
    <!-- 侧边导航 -->
    <aside
      class="glass-card"
      style="width: 260px; margin: 20px 0 20px 20px; padding: 24px 16px; border-radius: 24px; position: sticky; top: 20px; height: calc(100vh - 40px); display: flex; flex-direction: column;">
      <!-- Logo -->
      <div style="padding: 4px 12px 24px; border-bottom: 1px solid rgba(22,119,255,0.08);">
        <div class="flex" style="align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg,#4096FF,#1677FF); border-radius: 14px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 6px 16px rgba(22,119,255,0.35);">
            🏥
          </div>
          <div>
            <div style="font-size: 22px; font-weight: 700; color: var(--color-text);">智康 Agent</div>
            <div class="muted-text" style="font-size: 14px;">中老年健康智能体</div>
          </div>
        </div>
      </div>

      <!-- 欢迎语 -->
      <div class="flex-between" style="padding: 16px 12px; font-size: 18px;">
        <span>您好，{{ health.profile.name }}</span>
      </div>
      <div class="muted-text" style="padding: 0 12px 16px; font-size: 16px;">{{ chineseToday() }}</div>

      <!-- 菜单 -->
      <nav style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto;">
        <router-link
          v-for="r in menuRoutes"
          :key="r.path"
          :to="r.path"
          class="menu-item"
          style="padding: 14px 18px; border-radius: 14px; font-size: 20px; text-decoration: none; color: var(--color-text); display: flex; align-items: center; gap: 12px; transition: all .15s ease;"
          active-class="menu-item-active">
          <span style="font-size: 22px;">{{ (r.meta as any).icon }}</span>
          <span>{{ r.meta?.title }}</span>
        </router-link>
      </nav>

      <!-- 底部 AI 标识 -->
      <div style="padding: 16px; margin-top: 12px; border-radius: 16px; background: var(--color-primary-bg); color: var(--color-primary); font-size: 15px; line-height: 1.6;">
        <div style="font-weight: 600; margin-bottom: 4px;">💡 AI 智能助手</div>
        <div class="muted-text" style="font-size: 14px;">所有内容由前端规则引擎生成，仅供参考，就医请遵医嘱。</div>
      </div>
    </aside>

    <!-- 主体内容：修复路由渲染 + 动态描述 -->
    <main style="flex: 1; overflow-y: auto;">
      <div class="page-wrap">
        <div style="margin-bottom: 24px;">
          <div class="page-title">{{ currentTitle }}</div>
          <div class="muted-text" style="font-size: 18px;">{{ currentDesc }}</div>
        </div>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <div :key="route.path" style="min-height: 600px;">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.menu-item:hover {
  background: rgba(22, 119, 255, 0.08);
  color: var(--color-primary);
}
.menu-item-active {
  background: linear-gradient(135deg, rgba(22, 119, 255, 0.18), rgba(22, 119, 255, 0.08));
  color: var(--color-primary) !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.18);
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
