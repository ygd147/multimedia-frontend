<script setup lang="ts">
import type { MediaItem } from '../types/media'
import { getThumbnailUrl } from '../api/media'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  (e: 'click', item: MediaItem): void
}>()

// 判断是否为“图集目录”（需作为媒体资源展示）
function isImageFolder(): boolean {
  return !!props.item.is_dir && (props.item as any).category === 'image_folder'
}

// 获取预览图URL（统一使用thumbnail接口）
function getPreviewUrl(): string {
  if (props.item.is_dir && !isImageFolder()) {
    // 普通目录：返回文件夹图标占位（或空）
    return ''
  }
  // 文件 或 图集目录：使用缩略图接口
  return getThumbnailUrl(props.item.id)
}

function onClick() {
  emit('click', props.item)
}
</script>

<template>
  <div class="media-card" @click="onClick">
    <div class="card-cover">
      <img
        v-if="getPreviewUrl()"
        :src="getPreviewUrl()"
        :alt="item.file_name"
        loading="lazy"
      />
      <div v-else-if="item.is_dir && !isImageFolder()" class="folder-icon">
        📁
      </div>
      <div v-else class="file-icon">📄</div>
    </div>
    <div class="card-info">
      <div class="file-name" :title="item.file_name">
        {{ item.file_name }}
      </div>
      <div v-if="!item.is_dir" class="file-size">
        {{ (item.file_size / 1024).toFixed(0) }} KB
      </div>
      <div v-else-if="isImageFolder()" class="folder-badge">
        图片合集
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-card {
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border);
}

.media-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-cover {
  aspect-ratio: 1 / 1.2;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.folder-icon, .file-icon {
  font-size: 48px;
  opacity: 0.7;
}

.card-info {
  padding: 8px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-size, .folder-badge {
  font-size: 11px;
  color: var(--text-muted);
}

.folder-badge {
  background: #e9ecef;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 12px;
}
</style>