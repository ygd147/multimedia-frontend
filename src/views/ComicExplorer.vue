<script setup lang="ts">
defineOptions({ name: 'ComicExplorer' })

import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MediaType } from '../types/media'
import type { MediaItem } from '../types/media'
import { useMediaList } from '../composables/useMediaList'
import MediaCard from '../components/MediaCard.vue'
import Pagination from '../components/Pagination.vue'
import { fetchMediaDetail } from '../api/media'

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

/**
 * 监听路由参数变化，同步到 composable 并加载数据。
 * 注意：此处直接修改 composable 内部状态属于反模式，建议后续在 useMediaList 中暴露 setter 方法。
 */
watch(
  () => [route.query.dir, route.query.q, route.query.page] as const,
  async ([dir, q, page]) => {
    const newParentId = dir ? Number(dir) : undefined
    const newKeyword = (q as string) || ''
    const newPage = Number(page) || 1

    // 同步 dirStack（简化处理，生产环境建议由 composable 维护）
    if (newParentId === undefined) {
      if (mediaList.dirStack.value.length > 0) {
        mediaList.dirStack.value = []
      }
    } else if (newParentId !== mediaList.parentId.value) {
      const idx = mediaList.dirStack.value.findIndex(d => d.id === newParentId)
      if (idx >= 0) {
        mediaList.dirStack.value = mediaList.dirStack.value.slice(0, idx + 1)
      } else {
        // 通过 URL 直接访问未知目录时，临时显示 ID，实际项目应请求后端获取名称
        let dir_detial = await fetchMediaDetail(newParentId)
        mediaList.dirStack.value = [{ id: newParentId, name: dir_detial.file_name }]
      }
    }

    mediaList.parentId.value = newParentId
    mediaList.keyword.value = newKeyword
    mediaList.page.value = newPage
    mediaList.loadData()
  },
  { immediate: true }
)

/** 点击卡片：进入目录或打开详情 */
function onCardClick(item: MediaItem) {
  if (item.is_dir && item.category != 'image_folder') {
    // 保留现有查询参数，仅更新 dir 并重置页码
    mediaList.dirStack.value = [
      ...mediaList.dirStack.value,
      { id: item.id, name: item.dir_name || (item as any).file_name || '目录' }
    ]
    mediaList.parentId.value = item.id
    router.push({
      query: {
        ...route.query,
        dir: String(item.id),
        page: undefined   // 进入新目录重置页码
      }
    })
    return
  }
  router.push({ name: 'detail', params: { id: item.id } })
}

/** 面包屑导航：返回上级或根目录 */
function onBackToDir(index: number) {
  if (index < 0) {
    // 返回根目录，移除 dir 和 page，保留 q 等其他参数
    mediaList.dirStack.value = []
    mediaList.parentId.value = undefined
    router.push({
      query: {
        ...route.query,
        dir: undefined,
        page: undefined
      }
    })
  } else {
    const target = mediaList.dirStack.value[index]
    mediaList.dirStack.value = mediaList.dirStack.value.slice(0, index + 1)
    mediaList.parentId.value = target.id
    router.push({
      query: {
        ...route.query,
        dir: String(target.id),
        page: undefined
      }
    })
  }
}

/** 分页切换 */
function onChangePage(p: number) {
  mediaList.page.value = p
  router.replace({
    query: {
      ...route.query,
      page: p > 1 ? String(p) : undefined
    }
  })
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
