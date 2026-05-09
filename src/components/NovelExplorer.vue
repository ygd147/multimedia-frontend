<script setup lang="ts">
defineOptions({ name: 'NovelExplorer' })

import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNovelList } from '../composables/useNovelList'
import { formatFileSize } from '../utils/format'
import Pagination from './Pagination.vue'

const router = useRouter()
const route = useRoute()

const novelList = useNovelList()

const items = computed(() => novelList.items.value as any[])
const total = computed(() => novelList.total.value)
const loading = computed(() => novelList.loading.value)
const page = computed(() => novelList.page.value)
const perPage = computed(() => novelList.perPage.value)
const dirStack = computed(() => novelList.dirStack.value)

watch(() => route.query.q, (q) => {
  novelList.search((q as string) || '')
}, { immediate: true })

function handleClick(item: any) {
  if (item.is_dir) {
    novelList.enterDir(item.id, item.file_name || '目录')
  } else {
    router.push({ name: 'novel-detail', params: { id: item.id } })
  }
}

function onBackToDir(index: number) {
  novelList.backToDir(index)
}

function onChangePage(p: number) {
  novelList.changePage(p)
}
</script>

<template>
  <div class="novel-explorer">
    <!-- 面包屑导航 -->
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
      <span>暂无小说</span>
    </div>

    <!-- 树形列表结构 -->
    <div v-else class="novel-tree">
      <div
        v-for="item in items"
        :key="item.id"
        class="tree-item"
        :class="{ 'is-dir': item.is_dir }"
        @click="handleClick(item)"
      >
        <!-- 目录图标 -->
        <svg v-if="item.is_dir" class="item-icon folder-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
        </svg>
        <!-- 文件图标 -->
        <svg v-else class="item-icon file-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          <path d="M8 12h8v2H8zm0 4h5v2H8z" opacity="0.5"/>
        </svg>

        <span class="item-name">{{ item.file_name || item.dir_name }}</span>

        <span v-if="!item.is_dir && item.file_size" class="item-meta">
          {{ formatFileSize(item.file_size) }}
        </span>
      </div>
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
.novel-explorer {
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
  padding: 2px 6px;
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

.novel-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 12px;
  border: 1px solid transparent;
}

.tree-item:hover {
  background: var(--accent-bg);
  border-color: var(--border);
}

.tree-item.is-dir:hover {
  border-color: var(--accent);
}

.item-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}

.folder-icon {
  color: var(--accent); /* 目录图标用主题色 */
}

.file-icon {
  color: var(--text-muted); /* 文件图标用灰色 */
}

.tree-item:hover .file-icon {
  color: var(--accent);
}

.item-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-item.is-dir .item-name {
  font-weight: 600;
}

.item-meta {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}

@media (max-width: 640px) {
  .tree-item {
    padding: 10px 12px;
  }
  .item-name {
    font-size: 14px;
  }
}
</style>
