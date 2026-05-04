<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  total: number
  perPage: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))

const pages = computed(() => {
  const tp = totalPages.value
  if (tp <= 7) {
    return Array.from({ length: tp }, (_, i) => i + 1)
  }
  const p = props.page
  const result: (number | string)[] = [1]
  if (p > 3) result.push('...')
  const start = Math.max(2, p - 1)
  const end = Math.min(tp - 1, p + 1)
  for (let i = start; i <= end; i++) result.push(i)
  if (p < tp - 2) result.push('...')
  result.push(tp)
  return result
})
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button :disabled="page <= 1" @click="emit('change', page - 1)">上一页</button>
    <template v-for="p in pages" :key="p">
      <span v-if="p === '...'" class="ellipsis">...</span>
      <button
        v-else
        :class="{ active: p === page }"
        @click="emit('change', p as number)"
      >{{ p }}</button>
    </template>
    <button :disabled="page >= totalPages" @click="emit('change', page + 1)">下一页</button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px 0;
}

button {
  min-width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

button:hover:not(:disabled) {
  background: var(--hover-bg);
}

button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

.ellipsis {
  width: 32px;
  text-align: center;
  color: var(--text-muted);
}
</style>
