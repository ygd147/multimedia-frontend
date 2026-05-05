export interface VideoItem {
  id: number
  file_name: string
  category: 'video' | 'directory'
  is_dir: 0 | 1
  file_size?: number
  children_count?: number
  created_at: string
}

export interface VideoScanStatus {
  is_running: boolean
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: number
}

export interface VideoApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface PaginatedVideoData {
  items: VideoItem[]
  total: number
  page: number
  per_page: number
}

export interface VideoListParams {
  page?: number
  per_page?: number
  keyword?: string
  parent_id?: number
}
