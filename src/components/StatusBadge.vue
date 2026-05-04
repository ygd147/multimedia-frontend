<script setup lang="ts">
import { MediaStatus } from '../types/media'
import { statusText } from '../utils/format'

defineProps<{
  status: MediaStatus
}>()
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">
    <span class="status-dot"></span>
    {{ statusText(status) }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-0 { background: #f0f0f0; color: #999; }
.status-0 .status-dot { background: #999; }

.status-1 { background: #fff3e0; color: #e65100; }
.status-1 .status-dot {
  background: #e65100;
  animation: pulse 1s ease-in-out infinite;
}

.status-2 { background: #e8f5e9; color: #2e7d32; }
.status-2 .status-dot { background: #2e7d32; }

.status-3 { background: #fce4ec; color: #c62828; }
.status-3 .status-dot { background: #c62828; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
