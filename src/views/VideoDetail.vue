<script setup lang="ts">
import { ref, watch, onMounted,computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VideoItem } from '../types/video'
import { fetchVideoDetail, fetchVideoList, getVideoStreamUrl } from '../api/video'
import { formatFileSize } from '../utils/format'
import VideoPlayer from '../components/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()

// 获取播放器组件实例
const playerComponent = ref<InstanceType<typeof VideoPlayer> | null>(null)

// 【关键改动】分离路由 ID 和 实际播放 ID
const currentRouteId = computed(() => Number(route.params.id))
const playingId = ref<number>(Number(route.params.id))

const detail = ref<VideoItem | null>(null)
const loading = ref(false)
const error = ref('')
const episodes = ref<VideoItem[]>([])
const episodesLoading = ref(false)

async function load() {
  if (!playingId.value) return
  
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchVideoDetail(playingId.value)
    
    if (detail.value.parent_id) {
      await loadEpisodes(detail.value.parent_id)
    } else {
      episodes.value = []
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadEpisodes(parentId: number) {
  episodesLoading.value = true
  try {
    const data = await fetchVideoList({ parent_id: parentId, per_page: 999 })
    episodes.value = data.items || data
  } catch (e) {
    episodes.value = []
  } finally {
    episodesLoading.value = false
  }
}

// 【核心改动】无缝切换逻辑
function switchEpisode(episode: VideoItem) {
  if (episode.id === playingId.value) return

  // 1. 立即更新本地状态（驱动高亮和标题变化）
  playingId.value = episode.id
  detail.value = episode // 直接用列表里的数据，免去二次请求，做到真正的“秒切”

  // 2. 获取新视频的真实流地址
  const newUrl = getVideoStreamUrl(episode.id)

  // 3. 调用 DPlayer 底层 API 进行无缝切流
  if (playerComponent.value) {
    playerComponent.value.switchVideo(newUrl)
  }

  // 4. 静默修改浏览器地址栏（防刷新丢失，且不触发 Vue 路由重载）
  window.history.replaceState({}, '', `/video/${episode.id}`)

  // 5. 滚动回顶部对齐播放器
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化：仅当从“外部其他页面”强制跳转进入时触发完整 load
watch(currentRouteId, (newId) => {
  if (newId && newId !== playingId.value) {
    playingId.value = newId
    load()
  }
})

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

      <!-- 【注意】这里去掉了 :key，绑定了 ref -->
      <VideoPlayer
        v-if="detail"
        ref="playerComponent"
        :url="getVideoStreamUrl(detail.id)"
        :autoplay="true"
      />

      <div class="video-actions">
        <span class="hint">支持键盘快捷键：方向键快进/快退，空格暂停/播放</span>
      </div>

      <!-- 剧集列表 -->
      <div v-if="episodes.length > 0" class="episodes-section">
        <h3 class="section-title">
          剧集列表 
          <span class="episode-count">({{ episodes.length }})</span>
        </h3>
        
        <div v-if="episodesLoading" class="episodes-loading">加载列表中...</div>
        
        <ul v-else class="episode-list">
          <li
            v-for="ep in episodes"
            :key="ep.id"
            class="episode-item"
            :class="{ active: ep.id === playingId }"
            @click="switchEpisode(ep)"
          >
            <svg v-if="ep.id !== playingId" class="play-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <div v-else class="playing-indicator">
              <span></span><span></span><span></span>
            </div>
            
            <span class="episode-name">{{ ep.file_name }}</span>
            <span class="episode-size" v-if="ep.file_size">{{ formatFileSize(ep.file_size) }}</span>
          </li>
        </ul>
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

/* ===== 剧集列表样式 ===== */
.episodes-section {
  margin-top: 24px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-h);
}

.episode-count {
  font-weight: normal;
  font-size: 14px;
  color: var(--text-muted);
}

.episodes-loading {
  font-size: 13px;
  color: var(--text-muted);
  padding: 12px 0;
}

.episode-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
}

.episode-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  gap: 12px;
}

.episode-item:hover:not(.active) {
  background: var(--accent-bg);
}

.episode-item.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.episode-item.active .episode-size {
  color: rgba(255, 255, 255, 0.8);
}

.play-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.episode-item:hover .play-icon {
  opacity: 1;
}

.playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  width: 16px;
  flex-shrink: 0;
}

.playing-indicator span {
  width: 3px;
  background: currentColor;
  border-radius: 1px;
  animation: equalizer 0.8s ease-in-out infinite;
}

.playing-indicator span:nth-child(1) { height: 60%; animation-delay: 0s; }
.playing-indicator span:nth-child(2) { height: 100%; animation-delay: 0.2s; }
.playing-indicator span:nth-child(3) { height: 40%; animation-delay: 0.4s; }

@keyframes equalizer {
  0%, 100% { height: 40%; }
  50% { height: 100%; }
}

.episode-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-size {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .video-detail {
    padding: 8px;
  }

  .video-title {
    font-size: 16px;
  }

  .episode-item {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
