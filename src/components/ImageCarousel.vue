<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import type { ComicPage } from '../types/media'
import { getImage } from '../api/media'
import LazyImage from './LazyImage.vue' // 引入懒加载组件

const props = defineProps<{
  mediaId: number
  children: ComicPage[]
}>()

// 调试日志保留
onMounted(() => {
  console.log('[ImageCarousel] mediaId:', props.mediaId)
  console.log('[ImageCarousel] children length:', props.children.length)
  console.log('[ImageCarousel] first 3 children:', props.children.slice(0, 3))
})

// ---------- 原预览灯箱逻辑（完全不动） ----------
const isPreviewOpen = ref(false)
const currentPreviewUrl = ref('')
const currentPreviewAlt = ref('')
const previewContainer = ref<HTMLElement | null>(null)

const transform = reactive({
  scale: 1,
  translateX: 0,
  translateY: 0,
})

let dragStart = { x: 0, y: 0, translateX: 0, translateY: 0 }
let isDragging = false

function openPreview(url: string, alt: string) {
  currentPreviewUrl.value = url
  currentPreviewAlt.value = alt
  isPreviewOpen.value = true
  resetTransform()
  document.body.style.overflow = 'hidden'
}

function closePreview() {
  isPreviewOpen.value = false
  document.body.style.overflow = ''
  resetTransform()
}

function resetTransform() {
  transform.scale = 1
  transform.translateX = 0
  transform.translateY = 0
}

function onWheel(e: WheelEvent) {
  if (!isPreviewOpen.value) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(Math.max(transform.scale * delta, 0.5), 5)
  transform.scale = newScale
  if (transform.scale === 1) {
    transform.translateX = 0
    transform.translateY = 0
  }
}

function onMouseDown(e: MouseEvent) {
  if (!isPreviewOpen.value || transform.scale <= 1.02) return
  e.preventDefault()
  isDragging = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.translateX = transform.translateX
  dragStart.translateY = transform.translateY
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  transform.translateX = dragStart.translateX + dx
  transform.translateY = dragStart.translateY + dy
}

function onMouseUp() {
  isDragging = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// 触摸事件
let touchStartDistance = 0
let touchStartScale = 1
let touchStartTranslateX = 0
let touchStartTranslateY = 0
let isTouching = false

function getTouchDistance(e: TouchEvent): number {
  const t1 = e.touches[0]
  const t2 = e.touches[1]
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.hypot(dx, dy)
}

function onTouchStart(e: TouchEvent) {
  if (!isPreviewOpen.value) return
  if (e.touches.length === 2) {
    e.preventDefault()
    touchStartDistance = getTouchDistance(e)
    touchStartScale = transform.scale
    isTouching = false
  } else if (e.touches.length === 1 && transform.scale > 1.02) {
    isTouching = true
    dragStart.x = e.touches[0].clientX
    dragStart.y = e.touches[0].clientY
    touchStartTranslateX = transform.translateX
    touchStartTranslateY = transform.translateY
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isPreviewOpen.value) return
  if (e.touches.length === 2) {
    e.preventDefault()
    const distance = getTouchDistance(e)
    const scaleChange = distance / touchStartDistance
    let newScale = Math.min(Math.max(touchStartScale * scaleChange, 0.5), 5)
    transform.scale = newScale
    if (transform.scale === 1) {
      transform.translateX = 0
      transform.translateY = 0
    }
  } else if (e.touches.length === 1 && transform.scale > 1.02 && isTouching) {
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    transform.translateX = touchStartTranslateX + dx
    transform.translateY = touchStartTranslateY + dy
  }
}

function onTouchEnd() {
  isTouching = false
  touchStartDistance = 0
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPreviewOpen.value) {
    closePreview()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="waterfall-gallery">
    <div v-if="children.length" class="gallery-header">
      <span class="total-count">共 {{ children.length }} 张图片</span>
    </div>

    <div class="gallery-list">
      <div
        v-for="child in children"
        :key="child.index"
        class="gallery-item"
      >
        <!-- ✅ 这里替换为 LazyImage，用法和原来的 <img> 几乎一样 -->
        <LazyImage
          :src="getImage(mediaId, child.index)"
          :alt="child.file_name"
          class="gallery-image"
          @click="openPreview(getImage(mediaId, child.index), child.file_name)"
        />
      </div>
    </div>

    <!-- 全屏预览灯箱（完全不变） -->
    <Teleport to="body">
      <div
        v-if="isPreviewOpen"
        class="preview-overlay"
        @click.self="closePreview"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <button class="close-btn" @click="closePreview">✕</button>
        <div
          class="preview-container"
          ref="previewContainer"
          :style="{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            cursor: transform.scale > 1.02 ? 'grab' : 'default',
          }"
        >
          <img :src="currentPreviewUrl" :alt="currentPreviewAlt" class="preview-image" />
        </div>
        <div class="preview-tip" v-if="transform.scale > 1.02">
          拖动图片 | 滚轮缩放 | 双击重置
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 原来的样式完全不动，LazyImage 内部的 img 已经带了 gallery-image class */
.waterfall-gallery {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 12px;
  box-sizing: border-box;
}

.gallery-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.total-count {
  font-size: 13px;
  color: #666;
}

.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gallery-item {
  line-height: 0;
  background: #fafafa;
  border-radius: 0;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  transition: opacity 0.2s;
}

.gallery-image:hover {
  opacity: 0.92;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 100;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
  transition: transform 0.05s linear;
  will-change: transform;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.preview-tip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

@media (max-width: 768px) {
  .waterfall-gallery {
    padding: 8px;
  }
  .gallery-list {
    gap: 12px;
  }
  .close-btn {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  .preview-tip {
    font-size: 10px;
    bottom: 12px;
    white-space: nowrap;
  }
}
</style>