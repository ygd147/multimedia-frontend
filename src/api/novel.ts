import axios from 'axios'
import type { NovelApiResponse, PaginatedNovelData, NovelChapter, NovelContent, NovelListParams } from '../types/novel'

const http = axios.create({
  baseURL: '/api/novel',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.msg || err.message || '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export async function fetchNovelList(params: NovelListParams): Promise<PaginatedNovelData> {
  const { data } = await http.get<NovelApiResponse<PaginatedNovelData>>('', { params })
  return data.data
}

export async function fetchChapters(novelId: number): Promise<NovelChapter[]> {
  const { data } = await http.get<NovelApiResponse<NovelChapter[]>>(`/${novelId}/chapters`)
  return data.data
}

export async function fetchChapterContent(chapterId: number): Promise<NovelContent> {
  const { data } = await http.get<NovelApiResponse<NovelContent>>(`/chapter/${chapterId}`)
  return data.data
}

export async function deleteNovel(novelId: number): Promise<void> {
  await http.delete(`/${novelId}`)
}
