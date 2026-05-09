<script setup lang="ts">
defineOptions({ name: 'ComicExplorer' })

import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MediaType } from '../types/media'
import type { MediaItem } from '../types/media'
import { useMediaList } from '../composables/useMediaList'
import MediaCard from '../components/MediaCard.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const route = useRoute()

const mediaType = ref<MediaType>(MediaType.Image)
const mediaList = useMediaList(mediaType)

const items = computed(() => mediaList.items.value)
const total = computed(() => mediaList.total.value)
const loading = computed(() => mediaList.loading.value)
const page = computed(() => mediaList.page.value)
const perPage = computed(() => mediaList.perPage.value)
const dirStack = computed(() => mediaList.dirStack.value)

watch(() => route.query.q, (q) => {
  mediaList.search((q as string) || '')
}, { immediate: true })

function onCardClick(item: MediaItem) {
  if (item.is_dir) {
    mediaList.enterDir(item.id, item.dir_name || (item as any).file_name || '目录')
    return
  }
  router.push({ name: 'detail', params: { id: item.id } })
}

function onBackToDir(index: number) {
  mediaList.backToDir(index)
}

function onChangePage(p: number) {
  mediaList.changePage(p)
}
</script>

<template>
  <div class="comic-explorer">
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
.comic-explorer {
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
