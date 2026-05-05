<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import type { ChildImage } from '../types/media'
import { getImage } from '../api/media'

const props = defineProps<{
  mediaId: number
  children: ChildImage[]
}>()

// 获取图片页码（优先使用 page 字段，否则使用索引+1）
function getPageNumber(child: ChildImage, index: number): number {
  return (child as any).page ?? (index)
}

// 图片加载失败占位
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"%3E%3Crect x="2" y="2" width="20" height="20" fill="%23f0f0f0"/%3E%3Cpath d="M8 10h8M12 6v8M8 14l4 4 4-4"/%3E%3C/svg%3E'
  img.style.objectFit = 'contain'
}

// ==================== 预览灯箱逻辑 ====================
const isPreviewOpen = ref(false)
const currentPreviewUrl = ref('')
const currentPreviewAlt = ref('')
const previewContainer = ref<HTMLElement | null>(null)
void previewContainer

// 缩放与拖拽状态
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
  // 阻止背景滚动
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

// 滚轮缩放
function onWheel(e: WheelEvent) {
  if (!isPreviewOpen.value) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(Math.max(transform.scale * delta, 0.5), 5)
  transform.scale = newScale
  // 如果缩放回1，同时重置位移
  if (transform.scale === 1) {
    transform.translateX = 0
    transform.translateY = 0
  }
}

// 鼠标拖拽移动（仅当缩放 > 1.02 时）
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

// 触摸事件（双指缩放 + 拖拽）
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

// 键盘 ESC 关闭
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
    <!-- 图片总数信息 -->
    <div class="gallery-header" v-if="children.length">
      <span class="total-count">共 {{ children.length }} 张图片</span>
    </div>

    <!-- 瀑布流列表：一行一张图 -->
    <div class="gallery-list">
      <div
        v-for="(child, idx) in children"
        :key="child.id"
        class="gallery-item"
      >
        <img
          :src="getImage(mediaId, getPageNumber(child, idx))"
          :alt="child.file_name"
          class="gallery-image"
          loading="lazy"
          @error="handleImageError"
          @click="openPreview(getImage(mediaId, getPageNumber(child, idx)), child.file_name)"
        />
      </div>
    </div>

    <div v-if="!children.length" class="empty-state">暂无图片</div>

    <!-- 全屏预览灯箱 -->
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
/* 极简样式：去掉多余装饰 */
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

/* 全屏预览灯箱 */
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

/* 移动端适配 */
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