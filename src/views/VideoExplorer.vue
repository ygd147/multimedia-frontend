<script setup lang="ts">
defineOptions({ name: 'VideoExplorer' })

import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MediaItem } from '../types/media'
import { useVideoList } from '../composables/useVideoList'
import MediaCard from '../components/MediaCard.vue'
import Pagination from '../components/Pagination.vue'
import { fetchVideoDetail } from '../api/video'

const router = useRouter()
const route = useRoute()

const videoList = useVideoList()

const items = computed<MediaItem[]>(() => videoList.items.value as unknown as MediaItem[])

const displayItems = computed(() => {
  return items.value.map(item => {
    if ((item as any).category === 'video' && !item.is_dir) {
      return {
        ...item,
        thumbnail: `/api/video/thumbnail/${(item as any).file_hash}`,
      }
    }
    return item
  })
})

const total = computed(() => videoList.total.value)
const loading = computed(() => videoList.loading.value)
const page = computed(() => videoList.page.value)
const perPage = computed(() => videoList.perPage.value)
const dirStack = computed(() => videoList.dirStack.value)

watch(
  () => [route.query.dir, route.query.q, route.query.page] as const,
  async([dir, q, page]) => {
    const newParentId = dir ? Number(dir) : undefined
    const newKeyword = (q as string) || ''
    const newPage = Number(page) || 1

    if (newParentId === undefined) {
      if (videoList.dirStack.value.length > 0) {
        videoList.dirStack.value = []
      }
    } else if (newParentId !== videoList.parentId.value) {
      const idx = videoList.dirStack.value.findIndex(d => d.id === newParentId)
      if (idx >= 0) {
        videoList.dirStack.value = videoList.dirStack.value.slice(0, idx + 1)
      } else {
        let  dir_detial
        dir_detial = await fetchVideoDetail(newParentId)

        videoList.dirStack.value = [{ id: newParentId, name: dir_detial.file_name }]
      }
    }

    videoList.parentId.value = newParentId
    videoList.keyword.value = newKeyword
    videoList.page.value = newPage
    videoList.loadData()
  },
  { immediate: true }
)

function onCardClick(item: MediaItem) {
  const itemAny = item as any

  if (itemAny.category === 'video' && !item.is_dir) {
    router.push({ name: 'video-detail', params: { id: item.id } })
    return
  }

  if (item.is_dir) {
    videoList.dirStack.value = [...videoList.dirStack.value, { id: item.id, name: itemAny.file_name || '目录' }]
    videoList.parentId.value = item.id
    router.push({ query: { dir: String(item.id) } })
  }
}

function onBackToDir(index: number) {
  if (index < 0) {
    videoList.dirStack.value = []
    videoList.parentId.value = undefined
    router.push({ query: {} })
  } else {
    const target = videoList.dirStack.value[index]
    videoList.dirStack.value = videoList.dirStack.value.slice(0, index + 1)
    videoList.parentId.value = target.id
    router.push({ query: { dir: String(target.id) } })
  }
}

function onChangePage(p: number) {
  videoList.page.value = p
  router.replace({ query: { ...route.query, page: p > 1 ? String(p) : undefined } })
}
</script>

<template>
  <div class="video-explorer">
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

    <div v-else-if="displayItems.length === 0" class="empty-state">
      <span>暂无内容</span>
    </div>

    <div v-else class="media-grid">
      <MediaCard
        v-for="item in displayItems"
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
.video-explorer {
  display: flex;
  flex-direction: column;
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
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}
</style>
