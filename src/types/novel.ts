export interface NovelItem {
  id: number
  file_name: string
  is_dir: 0 | 1
  media_type: 2 | 3  // 2=novel, 3=directory
  parent_id: number | null
  file_size?: number
}

export interface NovelChapter {
  id: number
  media_id: number
  chapter_title: string
  chapter_order: number
  word_count: number
}

export interface NovelContent {
  id: number
  media_id: number
  chapter_title: string
  chapter_order: number
  word_count: number
  content: string
}

export interface NovelApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface PaginatedNovelData {
  items: NovelItem[]
  total: number
  page: number
  per_page: number
}

export interface NovelListParams {
  page?: number
  per_page?: number
  keyword?: string
  parent_id?: number
}
