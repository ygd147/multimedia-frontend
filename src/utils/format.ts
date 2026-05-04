import { MediaStatus } from '../types/media'

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, i)
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function statusText(status: MediaStatus): string {
  const map: Record<MediaStatus, string> = {
    [MediaStatus.Pending]: '待处理',
    [MediaStatus.Processing]: '预处理中',
    [MediaStatus.Ready]: '就绪',
    [MediaStatus.Failed]: '处理失败',
  }
  return map[status] ?? '未知'
}

export function mediaTypeLabel(type: number): string {
  const map: Record<number, string> = {
    1: '漫画',
    2: '小说',
    3: '视频',
  }
  return map[type] ?? '未知'
}
