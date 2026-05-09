<script setup lang="ts">
import { ref, watch, onMounted, computed, type Ref } from 'vue'
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
// 直接继承 VideoItem，不再覆盖 is_dir 的类型
interface TreeNode extends VideoItem {
  level: number
  expanded: boolean
  children: TreeNode[]
  isLoading: boolean
}

const treeData = ref<TreeNode[]>([])
const treeLoading = ref(false)

// 统一判断是否为目录，并强制转为 0 | 1 兼容 VideoItem
function normalizeIsDir(item: VideoItem): 0 | 1 {
  if (item.is_dir === 1 ) return 1
  if (item.file_size == null || item.file_size === 0) return 1
  return 0
}

// 获取缩略图 URL
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
      is_dir: normalizeIsDir(item), // 保持 0 | 1 类型
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

// 扁平化可见节点
const visibleEpisodes = computed(() => {
  const result: TreeNode[] = []
  function walk(nodes: TreeNode[], level: number) {
    for (const node of nodes) {
      node.level = level
      result.push(node)
      // is_dir 为 1 时展开子级
      if (node.is_dir && node.expanded && node.children.length > 0) {
        walk(node.children, level + 1)
      }
    }
  }
  walk(treeData.value, 0)
  return result
})

// 交互：点击节点
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

// 无缝切换
function switchEpisode(episode: TreeNode) {
  if (episode.id === playingId.value) return

  playingId.value = episode.id
  detail.value = episode

  const newUrl = getVideoStreamUrl(episode.id)
  if (playerComponent.value) {
    playerComponent.value.switchVideo(newUrl)
  }

  window.history.replaceState({}, '', `/video/${episode.id}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

      <div class="video-actions">
        <span class="hint">支持键盘快捷键：方向键快进/快退，空格暂停/播放</span>
      </div>

      <div v-if="treeData.length > 0" class="episodes-section">
        <h3 class="section-title">
          剧集与目录 
          <span class="episode-count">({{ treeData.length }})</span>
        </h3>
        
        <div v-if="treeLoading && treeData.length === 0" class="episodes-loading">加载列表中...</div>
        
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
            <!-- 目录状态 -->
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
            
            <!-- 视频文件状态 (带缩略图) -->
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

.video-actions { margin-top: 12px; text-align: center; }
.hint { font-size: 12px; color: var(--text-muted); }

/* ===== 树形剧集列表样式 ===== */
.episodes-section {
  margin-top: 24px; border-top: 1px solid var(--border); padding-top: 20px;
}

.section-title {
  font-size: 16px; font-weight: 600; margin: 0 0 12px; color: var(--text-h);
}

.episode-count { font-weight: normal; font-size: 14px; color: var(--text-muted); }
.episodes-loading { font-size: 13px; color: var(--text-muted); padding: 12px 0; }

.episode-list {
  display: flex; flex-direction: column; gap: 6px; max-height: 600px; overflow-y: auto;
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

/* 目录专属 */
.dir-icon { flex-shrink: 0; transition: transform 0.2s ease; color: var(--text-muted); }
.dir-icon.rotate-90 { transform: rotate(90deg); }
.folder-icon { flex-shrink: 0; color: var(--accent); }
.loading-spin { animation: spin 1s linear infinite; }

/* 缩略图与视频信息 */
.thumb-wrapper {
  position: relative; width: 80px; height: 45px; /* 16:9 比例 */
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
}
</style>
