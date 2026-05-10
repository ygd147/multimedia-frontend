import { ref, watch, type Ref } from 'vue'
import type { MediaItem, MediaListParams, MediaType } from '../types/media'
import { fetchMediaList } from '../api/media'

export function useMediaList(mediaType: Ref<MediaType | null>) {
  const items = ref<MediaItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const perPage = ref(40)
  const keyword = ref('')
  const parentId = ref<number | undefined>(undefined)
  const dirStack = ref<{ id: number; name: string }[]>([])

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function loadData() {
    loading.value = true
    try {
      const params: MediaListParams = {
        page: page.value,
        per_page: perPage.value,
        keyword: keyword.value || undefined,
        parent_id: parentId.value,
      }
      if (mediaType.value !== null) {
        params.media_type = mediaType.value
      }
      const data = await fetchMediaList(params)
      items.value = data.items
      total.value = data.total
    } catch {
      items.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function search(kw: string) {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      keyword.value = kw
      page.value = 1
      loadData()
    }, 300)
  }

  function changePage(p: number) {
    page.value = p
    loadData()
  }

  function enterDir(id: number, name: string) {
    dirStack.value.push({ id, name })
    parentId.value = id
    page.value = 1
    keyword.value = ''
    loadData()
  }

  function backToDir(index: number) {
    if (index < 0) {
      dirStack.value = []
      parentId.value = undefined
    } else {
      dirStack.value = dirStack.value.slice(0, index + 1)
      parentId.value = dirStack.value[index]?.id
    }
    page.value = 1
    loadData()
  }

  watch(mediaType, () => {
    dirStack.value = []
    parentId.value = undefined
    keyword.value = ''
    page.value = 1
    loadData()
  })

  return {
    items,
    total,
    loading,
    page,
    perPage,
    keyword,
    parentId,
    dirStack,
    loadData,
    search,
    changePage,
    enterDir,
    backToDir,
  }
}
