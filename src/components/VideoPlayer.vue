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

const subtitleActive = ref(false)
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

  currentVideoUrl.value = props.url
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

watch(() => props.url, () => {
  destroyPlayer()
  initPlayer()
})

onMounted(() => initPlayer())
onUnmounted(() => destroyPlayer())

// ============ 暴露给父组件的方法 ============
function switchVideo(newUrl: string) {
  if (!dp) return
  ;(dp as any).switchVideo({ url: newUrl })
  dp.play()
  currentVideoUrl.value = newUrl
}

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

function toggleSubtitle() {
  if (!dp) return
  ;(dp as any).subtitle.toggle()
}

/** 新增：快进/快退秒数（正数前进，负数后退） */
function seekBy(seconds: number) {
  if (!dp) return
  const newTime = Math.max(0, dp.video.currentTime + seconds)
  dp.seek(newTime)
}

defineExpose({
  switchVideo,
  loadSubtitle,
  toggleSubtitle,
  seekBy
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

.dplayer-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

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