export enum MediaType {
  Image = 1,
  Novel = 2,
  Video = 3,
}

export enum MediaStatus {
  Pending = 0,
  Processing = 1,
  Ready = 2,
  Failed = 3,
}

export interface MediaItem {
  id: number
  file_hash: string
  media_type: MediaType
  file_name: string
  file_size: number
  status: MediaStatus
  parent_id: number | null
  created_at: string
  is_dir?: boolean
  dir_name?: string
}

export interface ImageMeta {
  width: number
  height: number
  thumb_path: string
  is_archive: 0
  main_color: string
}

export interface ChildImage {
  id: number
  file_name: string
  thumb_path: string
  file_path: string
  width: number
  height: number
}

export interface ZipMeta {
  thumb_path: string
  is_archive: 1
  children: ChildImage[]
}

export interface NovelMeta {
  author: string
  word_count: number
  encoding: string
}

export interface VideoMeta {
  duration: number
  resolution: string
  video_codec: string
  cover_path: string
  is_transcoded: boolean
}

export type MediaMeta = ImageMeta | ZipMeta | NovelMeta | VideoMeta

export interface MediaDetail extends MediaItem {
  meta: MediaMeta
}

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface MediaListParams {
  page?: number
  per_page?: number
  media_type?: MediaType
  keyword?: string
  parent_id?: number
}
