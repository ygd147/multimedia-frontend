<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import DPlayer from 'dplayer'

const props = defineProps<{
  url: string
  cover?: string
  autoplay?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
let dp: DPlayer | null = null

// 控制字幕按钮的状态
const subtitleActive = ref(false)
// 内部记录当前实际播放的视频地址（避免依赖不安全的 dp.options）
const currentVideoUrl = ref(props.url)

function initPlayer() {
  if (!containerRef.value) return

  dp = new DPlayer({
    container: containerRef.value,
    autoplay: props.autoplay ?? false,
    theme: '#6366f1',
    loop: false,
    lang: 'zh-cn',
    screenshot: true,
    hotkey: true,
    preload: 'auto',
    volume: 0.7,
    video: {
      url: props.url,
      pic: props.cover,
      type: 'auto',
    },
    subtitle: {
      url: '',
      type: 'webvtt',
      fontSize: '20px',
      bottom: '10%',
      color: '#ffffff'
    }
  })

  // 同步内部记录的视频地址
  currentVideoUrl.value = props.url

  // 监听 DPlayer 内部字幕显隐事件（使用 any 绕过类型声明不完整）
  ;(dp as any).on('subtitle_show', () => { subtitleActive.value = true })
  ;(dp as any).on('subtitle_hide', () => { subtitleActive.value = false })
}

function destroyPlayer() {
  if (dp) {
    dp.destroy()
    dp = null
    subtitleActive.value = false
  }
}

// 监听 props.url 变化时，彻底销毁重建（适用于跨类型/跨页面刷新）
watch(() => props.url, () => {
  destroyPlayer()
  initPlayer()
})

onMounted(() => initPlayer())
onUnmounted(() => destroyPlayer())

// ==========================================
// 暴露给父组件的操作接口
// ==========================================

/** 1. 无缝切换视频源（不销毁播放器实例，保留音量等状态） */
function switchVideo(newUrl: string) {
  if (!dp) return
  // 通过 any 调用以兼容类型定义对第二参数的要求
  ;(dp as any).switchVideo({ url: newUrl })
  dp.play()
  currentVideoUrl.value = newUrl
}

/** 2. 动态加载/切换字幕文件 */
function loadSubtitle(subUrl: string) {
  if (!dp) return
  const currentTime = dp.video.currentTime
  ;(dp as any).switchVideo({
    url: currentVideoUrl.value,
    subtitle: {
      url: subUrl,
      type: 'webvtt',
      fontSize: '20px',
      bottom: '10%',
      color: '#ffffff'
    }
  })
  dp.seek(currentTime)
  dp.play()
  subtitleActive.value = true
}

/** 3. 切换字幕显示/隐藏状态 */
function toggleSubtitle() {
  if (!dp) return
  ;(dp as any).subtitle.toggle()
}

// 暴露出去
defineExpose({
  switchVideo,
  loadSubtitle,
  toggleSubtitle
})
</script>

<template>
  <div class="player-wrapper">
    <div ref="containerRef" class="dplayer-container"></div>

    <button
      class="subtitle-toggle-btn"
      :class="{ active: subtitleActive }"
      @click="toggleSubtitle"
      title="开关字幕"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 12h4" />
        <path d="M13 12h4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.player-wrapper {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

/* 修复点：去掉 height 和 padding-bottom，直接用 aspect-ratio 锁定 16:9 */
.dplayer-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

/* 修复点：加上 !important 强制覆盖 DPlayer 可能通过 JS 注入的内联错误样式 */
.dplayer-container :deep(.dplayer) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.subtitle-toggle-btn {
  position: absolute;
  bottom: 50px;
  right: 12px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.subtitle-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.subtitle-toggle-btn.active {
  background: var(--accent, #6366f1);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}
</style>
