<script setup lang="ts">
import type { MediaItem } from '../types/media'
import { getThumbnailUrl } from '../api/media'
import { formatFileSize } from '../utils/format'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  (e: 'click', item: MediaItem): void
}>()

function isVideoItem(): boolean {
  return (props.item as any).category === 'video'
}

function isVideoDir(): boolean {
  return (props.item as any).category === 'directory'
}

function isImageFolder(): boolean {
  return !!props.item.is_dir && (props.item as any).category === 'image_folder'
}

function getPreviewUrl(): string {
  if (props.item.is_dir && !isImageFolder()) {
    return ''
  }
  if (isVideoItem() || isVideoDir()) {
    return ''
  }
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
      <div v-else-if="isVideoItem()" class="icon-placeholder video-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <polygon points="5,3 19,12 5,21" fill="currentColor" />
        </svg>
      </div>
      <div v-else-if="item.is_dir && !isImageFolder()" class="icon-placeholder">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </div>
      <div v-else class="icon-placeholder">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      </div>
    </div>
    <div class="card-info">
      <div class="file-name" :title="item.file_name">
        {{ item.file_name }}
      </div>
      <div v-if="isVideoItem() && item.file_size" class="file-size">
        {{ formatFileSize(item.file_size) }}
      </div>
      <div v-else-if="!item.is_dir" class="file-size">
        {{ formatFileSize(item.file_size) }}
      </div>
      <div v-else-if="isImageFolder()" class="folder-badge">
        图片合集
      </div>
      <div v-else-if="isVideoDir() && (item as any).children_count" class="folder-badge">
        {{ (item as any).children_count }} 项
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

.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
}

.video-icon {
  background: #1a1a2e;
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
