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
  is_dir?: number
  dir_name?: string
  thumbnail?: string
  category?: string
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
  pages?: ComicPage[]      // ⭐ 新增：页列表（由后端 /pages 或 /detail 返回）
  children_count?: number  // 可选：子项数量
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

// types/media.ts 新增
export interface ComicPage {
  index: number           // 页码（0起始）
  file_name: string
  type: 'folder' | 'zip'  // 图片来源类型
  file_path?: string      // 仅 ZIP 内部路径
}