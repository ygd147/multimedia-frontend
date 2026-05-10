<script setup lang="ts">
defineOptions({ name: 'Home' })

import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MediaType } from '../types/media'
import SearchBar from '../components/SearchBar.vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: '漫画', value: MediaType.Image, path: '/comic' },
  { label: '小说', value: MediaType.Novel, path: '/novel' },
  { label: '视频', value: MediaType.Video, path: '/video' },
]

function getActiveTab(): MediaType {
  const p = route.path
  if (p.startsWith('/novel')) return MediaType.Novel
  if (p.startsWith('/video')) return MediaType.Video
  return MediaType.Image
}

const activeTab = ref(getActiveTab())

watch(() => route.path, () => {
  activeTab.value = getActiveTab()
})

function onTabClick(tab: typeof tabs[0]) {
  activeTab.value = tab.value
  router.push(tab.path)
}

//let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearch(kw: string) {
  router.replace({ 
      query: { 
        ...route.query, // 保留 parentId 等现有参数
        q: kw || undefined, 
        page: '1' // 搜索时强制回到第1页
      } 
    })
}
</script>

<template>
  <div class="home">
    <header class="home-header">
      <h1 class="app-title">多媒体资源管理</h1>
      <SearchBar @search="onSearch" />
    </header>

    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="onTabClick(tab)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.home-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
  white-space: nowrap;
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 24px;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 500;
}

@media (max-width: 640px) {
  .home {
    padding: 8px;
  }

  .home-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
