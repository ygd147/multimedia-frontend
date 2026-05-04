import { ref, onUnmounted } from 'vue'
import type { MediaDetail } from '../types/media'
import { MediaStatus } from '../types/media'
import { fetchMediaDetail } from '../api/media'

export function useMediaDetail() {
  const detail = ref<MediaDetail | null>(null)
  const loading = ref(false)
  const polling = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    polling.value = false
  }

  async function loadDetail(id: number) {
    stopPolling()
    loading.value = true
    try {
      detail.value = await fetchMediaDetail(id)
      if (detail.value.status === MediaStatus.Processing) {
        startPolling(id)
      }
    } finally {
      loading.value = false
    }
  }

  function startPolling(id: number) {
    polling.value = true
    pollTimer = setInterval(async () => {
      try {
        const d = await fetchMediaDetail(id)
        detail.value = d
        if (d.status !== MediaStatus.Processing) {
          stopPolling()
        }
      } catch {
        stopPolling()
      }
    }, 3000)
  }

  onUnmounted(() => stopPolling())

  return { detail, loading, polling, loadDetail }
}
