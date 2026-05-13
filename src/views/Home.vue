<script setup lang="ts">
defineOptions({ name: 'Home' })

import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MediaType } from '../types/media'
import SearchBar from '../components/SearchBar.vue'
import UploadModal from '../components/UploadModal.vue' // 引入弹窗
import { useActions } from '../composables/useActions'

const router = useRouter()
const route = useRoute()
const { scanning, scan } = useActions()

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

function onSearch(kw: string) {
  router.replace({ 
    query: { 
      ...route.query,
      q: kw || undefined, 
      page: '1'
    } 
  })
}

// ---------- 操作相关 ----------
function onScan() {
  scan(activeTab.value)
}

// 弹窗控制
const showUploadModal = ref(false)

function onUploaded() {
  // 上传完成后，可以触发页面刷新或者提示
  // 简单的做法是强行刷新当前路由组件
  router.replace({ query: { ...route.query, t: Date.now() } })
}
</script>

<template>
  <div class="home">
    <header class="home-header">
      <h1 class="app-title">多媒体资源管理</h1>
      
      <SearchBar @search="onSearch" class="header-search" />
      
      <div class="header-actions">
        <button 
          class="ghost-btn" 
          :disabled="scanning" 
          @click="onScan"
          title="扫描媒体库"
        >
          <span v-if="!scanning">扫描</span>
          <span v-else class="mini-spinner"></span>
        </button>
        
        <!-- 点击打开弹窗 -->
        <button class="ghost-btn" @click="showUploadModal = true" title="上传文件">
          上传
        </button>
      </div>
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

    <!-- 上传弹窗 -->
    <UploadModal 
      :visible="showUploadModal" 
      :mediaType="activeTab" 
      @close="showUploadModal = false"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style scoped>
/* 样式保持之前修改的样式不变 */
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
  flex-shrink: 0;
}

.header-search {
  flex: 0 1 320px; 
}

.header-actions {
  margin-left: auto; 
  display: flex;
  align-items: center;
  gap: 8px; 
  flex-shrink: 0;
}

.ghost-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 16px; 
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s; 
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px; 
  box-sizing: border-box;
}

.ghost-btn:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-bg, rgba(0,0,0,0.02)); 
}

.ghost-btn:active:not(:disabled) {
  transform: scale(0.97); 
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mini-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    flex-wrap: wrap;
  }

  .header-search {
    order: 3; 
    flex: 1 1 100%;
    margin-top: 8px;
  }

  .header-actions {
    order: 2; 
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
