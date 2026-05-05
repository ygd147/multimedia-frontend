<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VideoItem } from '../types/video'
import { fetchVideoDetail, getVideoStreamUrl } from '../api/video'
import { formatFileSize } from '../utils/format'
import VideoPlayer from '../components/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()
const detail = ref<VideoItem | null>(null)
const loading = ref(false)
const error = ref('')

const id = Number(route.params.id)

async function load() {
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchVideoDetail(id)
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function goBack() {
  router.back()
}
</script>

<template>
  <div class="video-detail">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        返回
      </button>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <span>{{ error }}</span>
    </div>

    <template v-else-if="detail">
      <div class="video-info">
        <h2 class="video-title">{{ detail.file_name }}</h2>
        <div class="video-meta">
          <span v-if="detail.file_size">{{ formatFileSize(detail.file_size) }}</span>
          <span>{{ detail.created_at?.slice(0, 10) }}</span>
        </div>
      </div>

      <VideoPlayer
        :url="getVideoStreamUrl(detail.id)"
        :autoplay="false"
      />

      <div class="video-actions">
        <span class="hint">支持键盘快捷键：方向键快进/快退，空格暂停/播放</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.video-detail {
  max-width: 1000px;
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

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
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

.video-info {
  margin-bottom: 16px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--text-h);
}

.video-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.video-actions {
  margin-top: 12px;
  text-align: center;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .video-detail {
    padding: 8px;
  }

  .video-title {
    font-size: 16px;
  }
}
</style>
