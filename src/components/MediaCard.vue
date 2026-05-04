<script setup lang="ts">
import type { MediaItem } from '../types/media'
import { MediaType } from '../types/media'
import { formatFileSize } from '../utils/format'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  click: [item: MediaItem]
}>()

function typeIcon(t: MediaType): string {
  if (props.item.is_dir) return '📁'
  if (t === MediaType.Image) return '🖼️'
  if (t === MediaType.Novel) return '📖'
  return '🎬'
}
</script>

<template>
  <div class="media-card" @click="emit('click', item)">
    <div class="card-thumb" :class="{ 'is-dir': item.is_dir }">
      <span class="thumb-placeholder">{{ typeIcon(item.media_type) }}</span>
    </div>
    <div class="card-body">
      <div class="card-title" :title="item.file_name || item.dir_name">
        {{ item.is_dir ? (item.dir_name || '目录') : item.file_name }}
      </div>
      <div class="card-meta">
        <span v-if="!item.is_dir">{{ formatFileSize(item.file_size) }}</span>
        <StatusBadge v-if="!item.is_dir" :status="item.status" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.media-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.card-thumb {
  aspect-ratio: 3 / 4;
  background: var(--thumb-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-thumb.is-dir {
  aspect-ratio: 16 / 9;
  background: var(--dir-bg, #e3f2fd);
}

.thumb-placeholder {
  font-size: 36px;
  opacity: 0.6;
}

.card-body {
  padding: 8px 10px;
}

.card-title {
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  margin-bottom: 4px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
