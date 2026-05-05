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
  })
}

function destroyPlayer() {
  if (dp) {
    dp.destroy()
    dp = null
  }
}

watch(() => props.url, () => {
  destroyPlayer()
  initPlayer()
})

onMounted(() => initPlayer())
onUnmounted(() => destroyPlayer())
</script>

<template>
  <div ref="containerRef" class="dplayer-container"></div>
</template>

<style scoped>
.dplayer-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
</style>
