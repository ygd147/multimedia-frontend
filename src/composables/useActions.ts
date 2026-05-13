import { ref } from 'vue'
import { MediaType } from '../types/media'
import type { MediaItem } from '../types/media'
import { fetchMediaList, triggerScan as triggerMediaScan } from '../api/media'
import axios from 'axios'

export function useActions() {
  const scanning = ref(false)
  const uploading = ref(false)
  
  // 目录相关状态
  const directories = ref<MediaItem[]>([])
  const loadingDirs = ref(false)

  const scan = async (type: MediaType) => {
    if (scanning.value) return
    scanning.value = true
    
    try {
      if (type === MediaType.Image) {
        await triggerMediaScan()
      } else {
        const typeMap = {
          [MediaType.Novel]: 'novel',
          [MediaType.Video]: 'video',
        }
        await axios.post(`/api/${typeMap[type]}/scan/trigger`)
      }
    } catch (err) {
      console.error('扫描请求失败:', err)
    } finally {
      scanning.value = false
    }
  }

  // 获取指定类型的根目录列表
  const fetchDirectories = async (type: MediaType) => {
    loadingDirs.value = true
    directories.value = []
    try {
      // 获取根目录下的文件 parent_id 传 undefined 或不传
      const res = await fetchMediaList({ media_type: type, parent_id: undefined })
      // 筛选出是目录的项 (兼容 is_dir 和 category 两种判断)
      directories.value = res.items.filter(item => item.is_dir === 1 || item.category === 'directory')
    } catch (err) {
      console.error('获取目录列表失败:', err)
    } finally {
      loadingDirs.value = false
    }
  }

  // 增加 parentId 参数
  const upload = async (type: MediaType, files: File[], parentId: number | null = null) => {
    if (uploading.value || files.length === 0) return
    uploading.value = true

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      
      // 如果有目标目录，加入 parent_id 字段 (具体字段名看后端要求，通常是 parent_id 或 directory_id)
      if (parentId !== null) {
        formData.append('parent_id', String(parentId))
      }

      const typeMap = {
        [MediaType.Image]: 'media',
        [MediaType.Novel]: 'novel',
        [MediaType.Video]: 'video',
      }
      
      await axios.post(`/api/${typeMap[type]}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('上传成功')
    } catch (err) {
      console.error('上传失败:', err)
    } finally {
      uploading.value = false
    }
  }

  return {
    scanning,
    scan,
    uploading,
    upload,
    directories,
    loadingDirs,
    fetchDirectories
  }
}
