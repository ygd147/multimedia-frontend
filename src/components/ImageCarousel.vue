<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChildImage } from '../types/media'
import { getThumbnailUrl, getRawUrl } from '../api/media'

const props = defineProps<{
  children: ChildImage[]
}>()

const currentIndex = ref(0)
const showOriginal = ref(false)
let touchStartX = 0

const current = computed(() => props.children[currentIndex.value])
const totalSlides = computed(() => props.children.length)

function goTo(index: number) {
  if (index >= 0 && index < totalSlides.value) {
    currentIndex.value = index
    showOriginal.value = false
  }
}

function goPrev() { goTo(currentIndex.value - 1) }
function goNext() { goTo(currentIndex.value + 1) }

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 50) {
    dx > 0 ? goPrev() : goNext()
  }
}

function toggleOriginal() {
  showOriginal.value = !showOriginal.value
}

function imageSrc(child: ChildImage): string {
  return showOriginal.value ? getRawUrl(child.id) : getThumbnailUrl(child.id)
}
</script>

<template>
  <div
    class="carousel"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="carousel-viewport">
      <button class="nav-btn prev" @click="goPrev" :disabled="currentIndex <= 0">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div class="carousel-content" @click="toggleOriginal">
        <img
          v-if="current"
          :key="current.id"
          :src="imageSrc(current)"
          :alt="current.file_name"
          class="carousel-image"
        />
        <div v-if="current" class="image-info">
          <span>{{ current.file_name }}</span>
          <span>{{ current.width }} x {{ current.height }}</span>
        </div>
      </div>

      <button class="nav-btn next" @click="goNext" :disabled="currentIndex >= totalSlides - 1">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <div class="carousel-indicators">
      <span class="counter">{{ currentIndex + 1 }} / {{ totalSlides }}</span>
      <span v-if="showOriginal" class="original-hint" @click="toggleOriginal">查看缩略图</span>
      <span v-else class="original-hint" @click="toggleOriginal">查看原图</span>
    </div>
  </div>
</template>

<style scoped>
.carousel {
  width: 100%;
}

.carousel-viewport {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.carousel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: zoom-in;
  min-height: 300px;
  justify-content: center;
}

.carousel-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 4px;
}

.image-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--hover-bg);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.carousel-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.counter {
  font-size: 13px;
  color: var(--text-muted);
}

.original-hint {
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  user-select: none;
}
</style>
