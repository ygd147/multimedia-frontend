<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MediaType, MediaStatus } from '../types/media'
import type { ImageMeta, ZipMeta, NovelMeta, VideoMeta } from '../types/media'
import { useMediaDetail } from '../composables/useMediaDetail'
import { formatFileSize, formatDuration, statusText, mediaTypeLabel } from '../utils/format'
import { getRawUrl, getCoverUrl } from '../api/media'
import StatusBadge from '../components/StatusBadge.vue'
import ImageCarousel from '../components/ImageCarousel.vue'

const route = useRoute()
const router = useRouter()
const { detail, loading, polling, loadDetail } = useMediaDetail()

const id = Number(route.params.id)

onMounted(() => loadDetail(id))

function goBack() {
  router.back()
}

const imageMeta = computed(() => (detail.value?.media_type === MediaType.Image && detail.value.meta) ? detail.value.meta as ImageMeta : null)
const zipMeta = computed(() => (detail.value?.media_type === MediaType.Image && (detail.value.meta as ZipMeta).is_archive === 1) ? detail.value.meta as ZipMeta : null)
const novelMeta = computed(() => detail.value?.media_type === MediaType.Novel ? detail.value.meta as NovelMeta : null)
const videoMeta = computed(() => detail.value?.media_type === MediaType.Video ? detail.value.meta as VideoMeta : null)

const isProcessing = computed(() => detail.value?.status === MediaStatus.Processing)
</script>

<template>
  <div class="detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
    </header>

    <div v-if="loading && !detail" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <template v-if="detail">
      <div class="detail-info">
        <h2 class="detail-title">{{ detail.file_name }}</h2>
        <div class="detail-meta">
          <span>{{ mediaTypeLabel(detail.media_type) }}</span>
          <span>{{ formatFileSize(detail.file_size) }}</span>
          <StatusBadge :status="detail.status" />
          <span v-if="polling" class="polling-hint">正在轮询状态...</span>
        </div>
        <div v-if="isProcessing" class="processing-overlay">
          <div class="spinner large"></div>
          <span>{{ statusText(detail.status) }}，请稍候...</span>
        </div>
      </div>

      <!-- Plain image -->
      <div v-if="imageMeta && !zipMeta && !isProcessing" class="image-section">
        <img
          :src="getRawUrl(detail.id)"
          :alt="detail.file_name"
          class="full-image"
        />
        <div class="image-details">
          <span>尺寸: {{ imageMeta.width }} x {{ imageMeta.height }}</span>
          <span v-if="imageMeta.main_color">主色: {{ imageMeta.main_color }}</span>
        </div>
      </div>

      <!-- ZIP archive -->
      <div v-if="zipMeta && !isProcessing" class="archive-section">
        <ImageCarousel :mediaId="detail.id"  :children="zipMeta.children" />
      </div>

      <!-- Novel -->
      <div v-if="novelMeta && !isProcessing" class="novel-section">
        <div class="meta-card">
          <div class="meta-row"><label>作者</label><span>{{ novelMeta.author || '未知' }}</span></div>
          <div class="meta-row"><label>字数</label><span>{{ novelMeta.word_count?.toLocaleString() || '-' }}</span></div>
          <div class="meta-row"><label>编码</label><span>{{ novelMeta.encoding || '-' }}</span></div>
        </div>
        <div class="chapter-placeholder">
          <p>章节内容将通过 GET /media/{{ detail.id }}/chapter/{index} 接口加载</p>
        </div>
      </div>

      <!-- Video -->
      <div v-if="videoMeta && !isProcessing" class="video-section">
        <div class="meta-card">
          <div class="meta-row"><label>时长</label><span>{{ formatDuration(videoMeta.duration) }}</span></div>
          <div class="meta-row"><label>分辨率</label><span>{{ videoMeta.resolution }}</span></div>
          <div class="meta-row"><label>编码</label><span>{{ videoMeta.video_codec }}</span></div>
          <div class="meta-row"><label>已转码</label><span>{{ videoMeta.is_transcoded ? '是' : '否' }}</span></div>
        </div>
        <img
          v-if="videoMeta.cover_path"
          :src="getCoverUrl(detail.id)"
          alt="封面"
          class="video-cover"
        />
        <div class="video-placeholder">
          <p>视频播放通过 GET /media/{{ detail.id }}/stream (支持 Range 请求)</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

.detail-header {
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.back-btn:hover {
  background: var(--accent-bg);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  gap: 12px;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.large {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-h);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.polling-hint {
  color: #e65100;
  font-size: 12px;
}

.processing-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
}

.image-section {
  text-align: center;
}

.full-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 6px;
  object-fit: contain;
}

.image-details {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-muted);
}

.meta-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-row label {
  width: 80px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.meta-row span {
  color: var(--text);
}

.chapter-placeholder,
.video-placeholder {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.video-cover {
  max-width: 100%;
  border-radius: 6px;
  margin-bottom: 16px;
}

@media (max-width: 640px) {
  .detail-page {
    padding: 8px;
  }

  .detail-title {
    font-size: 18px;
  }

  .meta-row {
    font-size: 13px;
  }
}
</style>
