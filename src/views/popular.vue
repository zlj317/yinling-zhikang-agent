<script setup lang="ts">
// AI 精准健康科普 · 根据用户慢病/体检异常动态推荐
import { ref, computed } from 'vue'
import { usePopularStore } from '@/stores/feature'
import { speak, stop } from '@/utils/speech'

const store = usePopularStore()
const keyword = ref('')

const filtered = computed(() => {
  const list = store.recommended
  if (!keyword.value.trim()) return list
  const k = keyword.value.trim()
  return list.filter(a =>
    a.title.includes(k) || a.content.includes(k) || a.tags.some(t => t.includes(k))
  )
})

const activeArticle = ref<typeof filtered.value[0] | null>(null)
function openDetail(a: typeof filtered.value[0]) {
  activeArticle.value = a
}

const reading = ref(false)
function speakArticle() {
  if (!activeArticle.value) return
  reading.value = true
  speak(`${activeArticle.value.title}。${activeArticle.value.content}`, {
    onEnd: () => reading.value = false
  })
}
function stopSpeak() { stop(); reading.value = false }
</script>

<template>
  <!-- 头部搜索 -->
  <div class="glass-card" style="padding: 28px; margin-bottom: 24px;">
    <div class="flex-between" style="gap: 16px; flex-wrap: wrap;">
      <div style="flex: 1;">
        <div class="section-title" style="margin: 0; font-size: 24px;">📚 AI 精准健康科普</div>
        <div class="muted-text" style="margin-top: 6px; font-size: 17px;">
          根据您的慢病情况和体检异常，为您个性化推荐
        </div>
      </div>
      <el-input
        v-model="keyword"
        size="large"
        placeholder="搜索关键字（高血压/血糖/饮食...）"
        style="max-width: 360px;"
        clearable />
    </div>
  </div>

  <!-- 科普卡片网格 -->
  <div style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
    <div v-for="a in filtered" :key="a.id" class="glass-card" style="padding: 24px; cursor: pointer; transition: transform .15s;"
      @mouseenter="($event.currentTarget as any).style.transform='translateY(-3px)'"
      @mouseleave="($event.currentTarget as any).style.transform='translateY(0)'"
      @click="openDetail(a)">
      <div class="flex-between" style="gap: 12px;">
        <div style="font-size: 54px;">{{ a.cover }}</div>
        <div style="flex: 1;">
          <div style="font-size: 20px; font-weight: 700; color: var(--color-text); line-height: 1.5;">{{ a.title }}</div>
          <div class="flex" style="gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            <span v-for="t in a.tags" :key="t" class="badge badge-primary" style="font-size: 13px;">{{ t }}</span>
          </div>
        </div>
      </div>
      <div style="font-size: 17px; color: var(--color-text-secondary); line-height: 1.8; margin-top: 14px;">
        {{ a.summary }}
      </div>
      <div v-if="a.matched && a.matched !== '通用科普'" style="margin-top: 14px;">
        <span class="ai-tag">🎯 为您匹配：{{ a.matched }}</span>
      </div>
      <div class="flex-between" style="margin-top: 16px;">
        <el-button size="large" round @click.stop="openDetail(a)">📖 查看全文</el-button>
        <el-button size="large" round :type="a.favored ? 'success' : 'default'" @click.stop="store.toggleFavor(a.id)">
          {{ a.favored ? '❤ 已收藏' : '🤍 收藏' }}
        </el-button>
      </div>
    </div>
  </div>

  <!-- 文章详情弹窗 -->
  <el-dialog v-model="activeArticle" :title="activeArticle?.title" width="720px" top="5vh">
    <div v-if="activeArticle" style="font-size: 19px; line-height: 2.2; color: var(--color-text); white-space: pre-line; max-height: 62vh; overflow-y: auto;">
      <div class="flex" style="gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
        <span v-for="t in activeArticle.tags" :key="t" class="badge badge-primary">{{ t }}</span>
        <span class="ai-tag" v-if="activeArticle.matched && activeArticle.matched !== '通用科普'">🎯 为您匹配：{{ activeArticle.matched }}</span>
      </div>
      {{ activeArticle.content }}
    </div>
    <template #footer>
      <el-button size="large" round @click="activeArticle = null">关闭</el-button>
      <el-button size="large" round @click="store.toggleFavor(activeArticle!.id)">
        {{ activeArticle?.favored ? '❤ 已收藏' : '🤍 收藏' }}
      </el-button>
      <el-button size="large" round type="success" @click="speakArticle">
        {{ reading ? '朗读中…' : '🔊 全文语音朗读' }}
      </el-button>
    </template>
  </el-dialog>

  <div v-if="!filtered.length" class="glass-card" style="margin-top: 24px; padding: 40px; text-align: center;">
    <div style="font-size: 48px;">🤔</div>
    <div style="font-size: 20px; margin-top: 8px;">未找到相关科普文章，换个关键词试试？</div>
  </div>
</template>
