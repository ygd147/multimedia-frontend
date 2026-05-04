import axios from 'axios'
import type { ApiResponse, MediaDetail, MediaListParams, PaginatedData, MediaItem } from '../types/media'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.msg || err.message || '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export async function fetchMediaList(params: MediaListParams): Promise<PaginatedData<MediaItem>> {
  const { data } = await http.get<ApiResponse<PaginatedData<MediaItem>>>('/media', { params })
  return data.data
}

export async function fetchMediaDetail(id: number): Promise<MediaDetail> {
  const { data } = await http.get<ApiResponse<MediaDetail>>(`/media/${id}`)
  return data.data
}

export function getThumbnailUrl(id: number): string {
  return `/api/media/${id}/thumbnail`
}

export function getRawUrl(id: number): string {
  return `/api/media/${id}/raw`
}

export function getCoverUrl(id: number): string {
  return `/api/media/${id}/cover`
}

export function getStreamUrl(id: number): string {
  return `/api/media/${id}/stream`
}

export function getChapterUrl(id: number, chapterIndex: number): string {
  return `/api/media/${id}/chapter/${chapterIndex}`
}
