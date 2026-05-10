<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { VideoItem } from '../types/video'
import { fetchVideoDetail, fetchVideoList, getVideoStreamUrl } from '../api/video'
import { formatFileSize } from '../utils/format'
import VideoPlayer from '../components/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()

const playerComponent = ref<InstanceType<typeof VideoPlayer> | null>(null)

const currentRouteId = computed(() => Number(route.params.id))
const playingId = ref<number>(Number(route.params.id))

const detail = ref<VideoItem | null>(null)
const loading = ref(false)
const error = ref('')

// ===== 树形结构相关 =====
interface TreeNode extends VideoItem {
  level: number
  expanded: boolean
  children: TreeNode[]
  isLoading: boolean
}

const treeData = ref<TreeNode[]>([])
const treeLoading = ref(false)

function normalizeIsDir(item: VideoItem): 0 | 1 {
  if (item.is_dir === 1 ) return 1
  if (item.file_size == null || item.file_size === 0) return 1
  return 0
}

function getVideoThumbnailUrl(item: any): string {
  if (item.thumbnail_url) return item.thumbnail_url
  if (item.thumbnail) return item.thumbnail
  if (item.file_hash) return `/api/video/thumbnail/${item.file_hash}`
  return ''
}

async function load() {
  if (!playingId.value) return
  
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchVideoDetail(playingId.value)
    
    if (detail.value.parent_id) {
      await loadTreeNodes(detail.value.parent_id, treeData)
    } else {
      treeData.value = []
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadTreeNodes(parentId: number, target: Ref<TreeNode[]> | TreeNode[]) {
  treeLoading.value = true
  try {
    const data = await fetchVideoList({ parent_id: parentId, per_page: 999 })
    const items = (data.items || data) as VideoItem[]
    
    const nodes = items.map(item => ({
      ...item,
      is_dir: normalizeIsDir(item),
      level: 0,
      expanded: false,
      children: [] as TreeNode[],
      isLoading: false
    }))
    
    if (Array.isArray(target)) {
      target.splice(0, target.length, ...nodes)
    } else {
      target.value = nodes
    }
  } catch (e) {
    console.error('加载目录失败', e)
  } finally {
    treeLoading.value = false
  }
}

// 扁平化可见节点（仅视频文件，排除目录）
const visibleEpisodes = computed(() => {
  const result: TreeNode[] = []
  function walk(nodes: TreeNode[], level: number) {
    for (const node of nodes) {
      node.level = level
      if (!node.is_dir) {
        result.push(node)
      }
      // 目录展开时继续深入子级（子级中的视频文件也会被收集）
      if (node.is_dir && node.expanded && node.children.length > 0) {
        walk(node.children, level + 1)
      }
    }
  }
  walk(treeData.value, 0)
  return result
})

// 当前播放项在可见剧集列表中的索引
const currentIndex = computed(() => {
  return visibleEpisodes.value.findIndex(ep => ep.id === playingId.value)
})

async function toggleNode(node: TreeNode) {
  if (!node.is_dir) {
    switchEpisode(node)
    return
  }
  
  if (node.children.length > 0) {
    node.expanded = !node.expanded
  } else {
    node.isLoading = true
    try {
      const data = await fetchVideoList({ parent_id: node.id, per_page: 999 })
      const items = (data.items || data) as VideoItem[]
      node.children = items.map(item => ({
        ...item,
        is_dir: normalizeIsDir(item),
        level: node.level + 1,
        expanded: false,
        children: [] as TreeNode[],
        isLoading: false
      }))
      node.expanded = true
    } catch (e) {
      console.error('加载子目录失败', e)
    } finally {
      node.isLoading = false
    }
  }
}

// 切换剧集
async function switchEpisode(episode: TreeNode) {
  if (episode.id === playingId.value) return

  playingId.value = episode.id
  detail.value = episode

  const newUrl = getVideoStreamUrl(episode.id)
  if (playerComponent.value) {
    playerComponent.value.switchVideo(newUrl)
  }

  window.history.replaceState({}, '', `/video/${episode.id}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // 滚动剧集列表到当前项中部
  await nextTick()
  scrollToActive()
}

/** 滚动剧集列表，使当前项居中 */
function scrollToActive() {
  const activeEl = document.querySelector('.episode-item.active')
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ============ 按钮控制方法 ============
function prevEpisode() {
  const idx = currentIndex.value
  if (idx > 0) {
    switchEpisode(visibleEpisodes.value[idx - 1])
  }
}

function nextEpisode() {
  const idx = currentIndex.value
  if (idx < visibleEpisodes.value.length - 1) {
    switchEpisode(visibleEpisodes.value[idx + 1])
  }
}

function skipBackward() {
  playerComponent.value?.seekBy(-5)
}

function skipForward() {
  playerComponent.value?.seekBy(5)
}

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

      <VideoPlayer
        v-if="detail"
        ref="playerComponent"
        :url="getVideoStreamUrl(detail.id)"
        :poster="getVideoThumbnailUrl(detail)"
        :autoplay="true"
      />

      <!-- 替换后的控制按钮区域 -->
      <div class="video-actions">
        <button 
          class="ctrl-btn" 
          :disabled="currentIndex <= 0"
          @click="prevEpisode"
          title="上一集"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 20L9 12l10-8v16zM5 19V5" />
          </svg>
          <span>上一集</span>
        </button>

        <button class="ctrl-btn" @click="skipBackward" title="后退 5 秒">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>-5秒</span>
        </button>

        <button class="ctrl-btn" @click="skipForward" title="前进 5 秒">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>+5秒</span>
        </button>

        <button 
          class="ctrl-btn" 
          :disabled="currentIndex >= visibleEpisodes.length - 1"
          @click="nextEpisode"
          title="下一集"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 4l10 8-10 8V4zM19 5v14" />
          </svg>
          <span>下一集</span>
        </button>
      </div>

      <div v-if="treeData.length > 0" class="episodes-section">
        <h3 class="section-title">
          剧集与目录 
          <span class="episode-count">({{ treeData.length }})</span>
        </h3>
        
        <div v-if="treeLoading && treeData.length === 0" class="episodes-loading">加载列表中...</div>
        
        <!-- 剧集列表（自动滚动至当前项） -->
        <div v-else class="episode-list">
          <div
            v-for="node in visibleEpisodes"
            :key="node.id"
            class="episode-item"
            :class="{ 
              active: !node.is_dir && node.id === playingId, 
              'is-dir': node.is_dir
            }"
            :style="{ paddingLeft: (16 + node.level * 24) + 'px' }"
            @click="toggleNode(node)"
          >
            <!-- 目录状态（仅目录有） -->
            <template v-if="node.is_dir">
              <svg v-if="node.isLoading" class="dir-icon loading-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
              </svg>
              <svg v-else class="dir-icon" :class="{ 'rotate-90': node.expanded }" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
              <svg class="folder-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.7">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <span class="item-name">{{ node.file_name }}</span>
            </template>
            
            <!-- 视频文件状态 -->
            <template v-else>
              <div class="thumb-wrapper">
                <img 
                  v-if="getVideoThumbnailUrl(node)"
                  :src="getVideoThumbnailUrl(node)" 
                  @error="($event.target as HTMLImageElement).style.display='none'"
                  alt=""
                />
                <svg class="play-overlay" viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div class="info-wrapper">
                <span class="item-name">{{ node.file_name }}</span>
                <span class="item-size" v-if="node.file_size">{{ formatFileSize(node.file_size) }}</span>
              </div>
            </template>
          </div>
        </div>
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

.detail-header { margin-bottom: 16px; }

.back-btn {
  display: inline-flex; align-items: center; gap: 4px; background: none;
  border: none; font-size: 15px; color: var(--accent); cursor: pointer;
  padding: 4px 8px; border-radius: 6px;
}
.back-btn:hover { background: var(--accent-bg); }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 20px; color: var(--text-muted); gap: 12px;
}

.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.video-info { margin-bottom: 16px; }

.video-title {
  font-size: 18px; font-weight: 600; margin: 0 0 6px; color: var(--text-h);
}

.video-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); }

/* ============ 控制按钮区域 ============ */
.video-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctrl-btn:hover:not(:disabled) {
  background: var(--accent-bg);
  border-color: var(--accent);
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctrl-btn svg {
  flex-shrink: 0;
}

/* ============ 剧集列表 ============ */
.episodes-section {
  margin-top: 24px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.section-title {
  font-size: 16px; font-weight: 600; margin: 0 0 12px; color: var(--text-h);
}

.episode-count { font-weight: normal; font-size: 14px; color: var(--text-muted); }
.episodes-loading { font-size: 13px; color: var(--text-muted); padding: 12px 0; }

.episode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 600px;
  overflow-y: auto;
  scroll-behavior: smooth; /* 顺滑滚动 */
}

.episode-item {
  display: flex; align-items: center; padding: 10px 14px; border-radius: 8px;
  background: var(--card-bg); cursor: pointer; transition: all 0.15s ease;
  font-size: 14px; gap: 10px; user-select: none;
}

.episode-item:hover:not(.active) { background: var(--accent-bg); }
.episode-item.is-dir:hover { border: 1px solid var(--accent); background: var(--accent-bg); }

.episode-item.active {
  background: var(--accent); color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.episode-item.active .item-size { color: rgba(255, 255, 255, 0.8); }

.dir-icon { flex-shrink: 0; transition: transform 0.2s ease; color: var(--text-muted); }
.dir-icon.rotate-90 { transform: rotate(90deg); }
.folder-icon { flex-shrink: 0; color: var(--accent); }
.loading-spin { animation: spin 1s linear infinite; }

.thumb-wrapper {
  position: relative; width: 80px; height: 45px;
  background: #000; border-radius: 4px; flex-shrink: 0;
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.thumb-wrapper img {
  width: 100%; height: 100%; object-fit: cover;
}
.play-overlay {
  position: absolute; opacity: 0.9; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
.episode-item.active .play-overlay { opacity: 1; }

.info-wrapper {
  flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0;
}

.item-name {
  font-size: 14px; font-weight: 500; color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.is-dir .item-name { font-weight: 600; }

.item-size {
  font-size: 12px; color: var(--text-muted); flex-shrink: 0;
}

@media (max-width: 640px) {
  .video-detail { padding: 8px; }
  .video-title { font-size: 16px; }
  .episode-item { padding: 8px 12px; }
  .thumb-wrapper { width: 64px; height: 36px; }
  .ctrl-btn { padding: 6px 12px; font-size: 13px; }
}
</style>