<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    // 占位图：未进入视口或加载失败时显示，可传入默认 data URI
    placeholder?: string
  }>(),
  {
    placeholder:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"%3E%3Crect x="2" y="2" width="20" height="20" fill="%23f0f0f0"/%3E%3Cpath d="M8 10h8M12 6v8M8 14l4 4 4-4"/%3E%3C/svg%3E',
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const imgRef = ref<HTMLImageElement>()
const hasEntered = ref(false)
const isError = ref(false)

let observer: IntersectionObserver | null = null

function applySrc() {
  if (!imgRef.value) return
  if (hasEntered.value && !isError.value) {
    imgRef.value.src = props.src
  } else {
    imgRef.value.src = props.placeholder
    // 错误状态下改用 contain 避免占位图被裁切
    if (isError.value) {
      imgRef.value.style.objectFit = 'contain'
    }
  }
}

function handleError() {
  isError.value = true
  applySrc()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hasEntered.value = true
          applySrc()
          observer?.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '200px', // 提前 200px 开始加载，保证滚动体验
    }
  )

  if (imgRef.value) {
    // 初始先显示占位图
    imgRef.value.src = props.placeholder
    observer.observe(imgRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <img
    ref="imgRef"
    :alt="alt"
    class="gallery-image"
    @click="emit('click', $event)"
    @error="handleError"
  />
</template>