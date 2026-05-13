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
      // 传给后端的 parent_id 应该是不传(undefined)，而不是传一个字符串 "undefined"
      const res = await fetchMediaList({ media_type: type })
      // 筛选出是目录的项 (兼容 is_dir 和 category 两种判断)
      directories.value = res.items.filter(item => item.is_dir === 1 || item.category === 'directory')
    } catch (err) {
      console.error('获取目录列表失败:', err)
    } finally {
      loadingDirs.value = false
    }
  }

  // 增加 parentId 参数
  const upload = async (type: MediaType, files: File[], parentId?: number | null) => {
    if (uploading.value || files.length === 0) return
    uploading.value = true

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      
      // 【修复点】：必须同时判断 null 和 undefined
      // 在 JS 中，使用 != null 可以同时过滤掉 null 和 undefined
      if (parentId != null) {
        formData.append('parent_id', String(parentId))
      }
      // 如果 parentId 是 null 或 undefined，则不 append 该字段
      // 后端 request.form.get('parent_id') 就会得到 None，符合预期

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
