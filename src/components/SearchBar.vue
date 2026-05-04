<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')
const emit = defineEmits<{
  search: [value: string]
}>()

function onInput() {
  emit('search', keyword.value)
}

function onClear() {
  keyword.value = ''
  emit('search', '')
}
</script>

<template>
  <div class="search-bar">
    <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input
      v-model="keyword"
      type="text"
      placeholder="搜索文件名..."
      @input="onInput"
    />
    <button v-if="keyword" class="clear-btn" @click="onClear">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--accent);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  min-width: 0;
}

input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: var(--text);
  background: var(--hover-bg);
}
</style>
