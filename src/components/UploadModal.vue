<script setup lang="ts">
import { ref, watch } from 'vue'
import { MediaType } from '../types/media'
import type { MediaItem } from '../types/media'
import { useActions } from '../composables/useActions'

const props = defineProps<{
  visible: boolean
  mediaType: MediaType
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'uploaded'): void
}>()

const { directories, loadingDirs, fetchDirectories, uploading, upload } = useActions()

const selectedDirId = ref<number | null>(null)
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

// 监听弹窗打开，获取目录列表
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedDirId.value = null
    selectedFiles.value = []
    fetchDirectories(props.mediaType)
  }
})

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

async function handleSubmit() {
  if (selectedFiles.value.length === 0) return
  
  await upload(props.mediaType, selectedFiles.value, selectedDirId.value)
  
  // 上传完成后关闭弹窗并通知父组件刷新
  emit('uploaded')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container">
        <h3 class="modal-title">上传文件</h3>
        
        <div class="form-group">
          <label>目标目录</label>
          <select v-model="selectedDirId" class="form-select" :disabled="loadingDirs">
            <option :value="null">根目录</option>
            <option 
              v-for="dir in directories" 
              :key="dir.id" 
              :value="dir.id"
            >
              {{ dir.dir_name || dir.file_name }}
            </option>
          </select>
          <span v-if="loadingDirs" class="loading-hint">加载目录中...</span>
        </div>

        <div class="form-group">
          <label>选择文件</label>
          <div class="file-input-wrapper">
            <button class="ghost-btn" @click="triggerFileSelect">浏览文件...</button>
            <span class="file-names" v-if="selectedFiles.length > 0">
              已选 {{ selectedFiles.length }} 个文件
            </span>
            <span class="file-names" v-else>未选择文件</span>
          </div>
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            :multiple="mediaType !== MediaType.Novel" 
            @change="handleFileChange" 
          />
        </div>

        <div class="modal-actions">
          <button class="ghost-btn" @click="emit('close')">取消</button>
          <button 
            class="primary-btn" 
            :disabled="uploading || selectedFiles.length === 0" 
            @click="handleSubmit"
          >
            <span v-if="!uploading">开始上传</span>
            <span v-else class="mini-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h, #111);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text, #333);
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border, #ddd);
  background: var(--bg, #f9f9f9);
  color: var(--text, #333);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-select:focus {
  border-color: var(--accent, #0066cc);
}

.loading-hint {
  font-size: 12px;
  color: var(--text-muted, #888);
  margin-left: 8px;
}

.file-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-names {
  font-size: 13px;
  color: var(--text-muted, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* 复用并扩展 Home 里的按钮样式 */
.ghost-btn {
  background: transparent;
  border: 1px solid var(--border, #ddd);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-muted, #666);
  cursor: pointer;
  transition: all 0.2s;
}

.ghost-btn:hover:not(:disabled) {
  color: var(--accent, #0066cc);
  border-color: var(--accent, #0066cc);
}

.primary-btn {
  background: var(--accent, #0066cc);
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.primary-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-btn:disabled, .ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mini-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
