import axios from 'axios'
import type { VideoApiResponse, PaginatedVideoData, VideoItem, VideoScanStatus, VideoListParams } from '../types/video'

const http = axios.create({
  baseURL: '/api/video',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.msg || err.message || '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export async function fetchVideoList(params: VideoListParams): Promise<PaginatedVideoData> {
  const { data } = await http.get<VideoApiResponse<PaginatedVideoData>>('/', { params })
  return data.data
}

export async function fetchVideoDetail(id: number): Promise<VideoItem> {
  const { data } = await http.get<VideoApiResponse<VideoItem>>(`/${id}`)
  return data.data
}

export async function deleteVideo(id: number): Promise<void> {
  await http.delete(`/${id}`)
}

export function getVideoStreamUrl(id: number): string {
  return `/api/video/${id}/stream`
}

export async function triggerScan(): Promise<{ message: string }> {
  const { data } = await http.post<VideoApiResponse<{ message: string }>>('/scan/trigger')
  return data.data
}

export async function fetchScanStatus(): Promise<VideoScanStatus> {
  const { data } = await http.get<VideoApiResponse<VideoScanStatus>>('/scan/status')
  return data.data
}
