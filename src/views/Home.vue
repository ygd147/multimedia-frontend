<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MediaType } from '../types/media'
import type { MediaItem } from '../types/media'
import { useMediaList } from '../composables/useMediaList'
import { useVideoList } from '../composables/useVideoList'
import SearchBar from '../components/SearchBar.vue'
import MediaCard from '../components/MediaCard.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: '漫画', value: MediaType.Image },
  { label: '小说', value: MediaType.Novel },
  { label: '视频', value: MediaType.Video },
]

function getTabFromQuery(): MediaType {
  const q = route.query.tab
  if (q === '2') return MediaType.Novel
  if (q === '3') return MediaType.Video
  return MediaType.Image
}

const activeTab = ref<MediaType>(getTabFromQuery())
const isVideoTab = computed(() => activeTab.value === MediaType.Video)
const mediaType = computed(() => isVideoTab.value ? null : activeTab.value)

// Image/Novel composable
const mediaList = useMediaList(mediaType)

// Video composable
const videoList = useVideoList()

// Unified state - switch based on active tab
const items = computed<MediaItem[]>(() => {
  if (isVideoTab.value) {
    return videoList.items.value as unknown as MediaItem[]
  }
  return mediaList.items.value
})
const total = computed(() => isVideoTab.value ? videoList.total.value : mediaList.total.value)
const loading = computed(() => isVideoTab.value ? videoList.loading.value : mediaList.loading.value)
const page = computed(() => isVideoTab.value ? videoList.page.value : mediaList.page.value)
const perPage = computed(() => isVideoTab.value ? videoList.perPage.value : mediaList.perPage.value)
const dirStack = computed(() => isVideoTab.value ? videoList.dirStack.value : mediaList.dirStack.value)

// Load initial data
mediaList.loadData()

// When switching to video tab, load video data if not loaded
watch(isVideoTab, (isVideo) => {
  if (isVideo && videoList.items.value.length === 0) {
    videoList.loadData()
  }
})

function onTabClick(tab: MediaType) {
  activeTab.value = tab
  router.replace({ query: { tab: String(tab) } })
}

function onCardClick(item: MediaItem) {
  const itemAny = item as any
  const isVideoDir = itemAny.category === 'directory'
  const isVideoFile = itemAny.category === 'video'
  const isImageFolder = item.is_dir && itemAny.category === 'image_folder'

  if (isVideoFile) {
    router.push({ name: 'video-detail', params: { id: item.id } })
    return
  }

  if (isVideoDir) {
    videoList.enterDir(item.id, item.file_name || '目录')
    return
  }

  if (item.is_dir && !isImageFolder) {
    mediaList.enterDir(item.id, item.dir_name || '目录')
    return
  }

  // File or image_folder: navigate to detail page
  router.push({ name: 'detail', params: { id: item.id } })
}

function onSearch(kw: string) {
  if (isVideoTab.value) {
    videoList.search(kw)
  } else {
    mediaList.search(kw)
  }
}

function onChangePage(p: number) {
  if (isVideoTab.value) {
    videoList.changePage(p)
  } else {
    mediaList.changePage(p)
  }
}

function onBackToDir(index: number) {
  if (isVideoTab.value) {
    videoList.backToDir(index)
  } else {
    mediaList.backToDir(index)
  }
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
        @click="onTabClick(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-if="dirStack.length > 0" class="breadcrumb">
      <span class="breadcrumb-item" @click="onBackToDir(-1)">根目录</span>
      <template v-for="(d, i) in dirStack" :key="d.id">
        <span class="breadcrumb-sep">/</span>
        <span
          class="breadcrumb-item"
          :class="{ current: i === dirStack.length - 1 }"
          @click="onBackToDir(i)"
        >
          {{ d.name }}
        </span>
      </template>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <span>暂无内容</span>
    </div>

    <div v-else class="media-grid">
      <MediaCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        @click="onCardClick"
      />
    </div>

    <Pagination
      v-if="!loading && total > perPage"
      :page="page"
      :total="total"
      :per-page="perPage"
      @change="onChangePage"
    />
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

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  color: var(--accent);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.breadcrumb-item:hover {
  background: var(--accent-bg);
}

.breadcrumb-item.current {
  color: var(--text);
  cursor: default;
  font-weight: 500;
}

.breadcrumb-item.current:hover {
  background: none;
}

.breadcrumb-sep {
  color: var(--text-muted);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
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

  .media-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
