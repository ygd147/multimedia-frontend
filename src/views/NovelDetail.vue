<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NovelChapter, NovelContent } from '../types/novel'
import { fetchChapters, fetchChapterContent } from '../api/novel'

const route = useRoute()
const router = useRouter()
const novelId = Number(route.params.id)

// ===== Reader settings =====
interface ReaderSettings {
  fontSize: number
  lineHeight: number
  bgColor: string
  textColor: string
}

const STORAGE_KEY = 'novel-reader-settings'
const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  bgColor: '#f5f0e8',
  textColor: '#333',
}

function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {}
  return { ...defaultSettings }
}

function saveSettings(s: ReaderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

const readerSettings = ref<ReaderSettings>(loadSettings())

function changeFontSize(delta: number) {
  const s = { ...readerSettings.value }
  s.fontSize = Math.min(32, Math.max(14, s.fontSize + delta))
  readerSettings.value = s
  saveSettings(s)
}

function changeLineHeight(delta: number) {
  const s = { ...readerSettings.value }
  s.lineHeight = Math.round((s.lineHeight + delta) * 10) / 10
  s.lineHeight = Math.min(2.5, Math.max(1.4, s.lineHeight))
  readerSettings.value = s
  saveSettings(s)
}

function setBgColor(color: string) {
  const s = { ...readerSettings.value }
  s.bgColor = color
  readerSettings.value = s
  saveSettings(s)
}

function setTextColor(color: string) {
  const s = { ...readerSettings.value }
  s.textColor = color
  readerSettings.value = s
  saveSettings(s)
}

const bgPresets = [
  { label: '羊皮纸', color: '#f5f0e8' },
  { label: '纯白', color: '#ffffff' },
  { label: '护眼绿', color: '#c7edcc' },
  { label: '暗黑', color: '#1a1a1a' },
]

const textPresets = [
  { label: '深灰', color: '#333' },
  { label: '纯黑', color: '#000' },
  { label: '浅灰', color: '#666' },
]

// ===== State =====
const chapters = ref<NovelChapter[]>([])
const chaptersLoading = ref(false)
const currentChapter = ref<NovelContent | null>(null)
const contentLoading = ref(false)
const error = ref('')
const mode = ref<'list' | 'reader'>('list')
const showSettings = ref(false)

// ===== Chapter list =====
async function loadChapters() {
  chaptersLoading.value = true
  try {
    chapters.value = await fetchChapters(novelId)
  } catch {
    error.value = '加载章节列表失败'
  } finally {
    chaptersLoading.value = false
  }
}

// ===== Chapter content =====
async function loadChapter(chapterId: number) {
  contentLoading.value = true
  error.value = ''
  try {
    currentChapter.value = await fetchChapterContent(chapterId)
    mode.value = 'reader'
    showSettings.value = false
    // 切换章节后回到顶部
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  } catch {
    error.value = '加载章节内容失败'
  } finally {
    contentLoading.value = false
  }
}

const currentChapterIndex = computed(() => {
  if (!currentChapter.value) return -1
  return chapters.value.findIndex(c => c.id === currentChapter.value!.id)
})

const hasPrevChapter = computed(() => currentChapterIndex.value > 0)
const hasNextChapter = computed(() => currentChapterIndex.value < chapters.value.length - 1)

function goPrevChapter() {
  const idx = currentChapterIndex.value
  if (idx > 0) loadChapter(chapters.value[idx - 1].id)
}

function goNextChapter() {
  const idx = currentChapterIndex.value
  if (idx < chapters.value.length - 1) loadChapter(chapters.value[idx + 1].id)
}

function goToList() {
  mode.value = 'list'
  currentChapter.value = null
  window.scrollTo({ top: 0 })
}

// 【优化】智能段落解析：合并连续换行，提取真正段落
const paragraphs = computed(() => {
  const text = currentChapter.value?.content || ''
  if (!text) return []
  // 将2个及以上的连续换行符视为段落分隔，1个换行符视为段落内折行
  return text.split(/\n{2,}/).filter(p => p.trim() !== '')
})

onMounted(loadChapters)

function goBack() {
  if (mode.value === 'reader') {
    goToList()
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="novel-detail" :class="{ 'reader-mode': mode === 'reader' }">
    <!-- Header -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {{ mode === 'reader' ? '目录' : '返回' }}
      </button>
      <span v-if="mode === 'reader' && currentChapter" class="header-title">
        {{ currentChapter.chapter_title }}
      </span>
      <span v-else-if="mode === 'list'" class="header-title">章节目录</span>
      <button
        v-if="mode === 'reader'"
        class="settings-btn"
        :class="{ active: showSettings }"
        @click="showSettings = !showSettings"
        title="阅读设置"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
    </header>

    <div v-if="error && mode === 'list'" class="error-state">
      <span>{{ error }}</span>
    </div>

    <!-- ===== LIST MODE ===== -->
    <div v-if="mode === 'list'" class="list-view">
      <div v-if="chaptersLoading" class="loading-state">
        <div class="spinner"></div>
        <span>加载章节目录...</span>
      </div>
      <div v-else-if="chapters.length === 0" class="empty-state">暂无章节</div>
      <div v-else class="chapter-grid">
        <button v-for="ch in chapters" :key="ch.id" class="chapter-card" @click="loadChapter(ch.id)">
          <span class="chapter-card-title">{{ ch.chapter_title }}</span>
          <span class="chapter-card-meta">{{ ch.word_count?.toLocaleString() }}字</span>
        </button>
      </div>
    </div>

    <!-- ===== READER MODE ===== -->
    <div v-if="mode === 'reader'" class="reader-view">
      <div v-if="contentLoading" class="loading-state">
        <div class="spinner"></div>
        <span>加载章节内容...</span>
      </div>
      <div v-else-if="error" class="error-state"><span>{{ error }}</span></div>

      <template v-if="currentChapter && !contentLoading">
        <!-- 阅读内容区域 (移除虚拟滚动，使用原生滚动) -->
        <div class="reader-content-wrapper" :style="{ background: readerSettings.bgColor, color: readerSettings.textColor }">
          <div class="reader-content-inner" :style="{ fontSize: readerSettings.fontSize + 'px', lineHeight: readerSettings.lineHeight }">
            <h2 class="reader-chapter-title">{{ currentChapter.chapter_title }}</h2>
            <p v-for="(p, idx) in paragraphs" :key="idx" class="text-paragraph">{{ p }}</p>
            <div class="reader-end-marker">--- 本章完 ---</div>
          </div>
        </div>

        <!-- Bottom navigation bar -->
        <div class="reader-nav">
          <button class="nav-btn" :disabled="!hasPrevChapter" @click="goPrevChapter">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
            上一章
          </button>
          <button class="nav-btn toc-btn" @click="goToList">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>
            目录
          </button>
          <button class="nav-btn" :disabled="!hasNextChapter" @click="goNextChapter">
            下一章
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </template>
    </div>

    <!-- ===== Settings Overlay (遮罩层) ===== -->
    <Transition name="fade">
      <div v-if="showSettings" class="settings-overlay" @click="showSettings = false"></div>
    </Transition>

    <!-- ===== Settings Panel (从底部滑出的浮层) ===== -->
    <Transition name="slide-up">
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-handle"></div>
        <div class="settings-inner">
          <div class="setting-row">
            <label>字号</label>
            <div class="setting-controls">
              <button class="setting-btn" @click="changeFontSize(-1)">A-</button>
              <span class="setting-value">{{ readerSettings.fontSize }}</span>
              <button class="setting-btn" @click="changeFontSize(1)">A+</button>
            </div>
          </div>
          <div class="setting-row">
            <label>间距</label>
            <div class="setting-controls">
              <button class="setting-btn" @click="changeLineHeight(-0.2)">缩</button>
              <span class="setting-value">{{ readerSettings.lineHeight.toFixed(1) }}</span>
              <button class="setting-btn" @click="changeLineHeight(0.2)">扩</button>
            </div>
          </div>
          <div class="setting-row">
            <label>背景</label>
            <div class="color-swatches">
              <button v-for="p in bgPresets" :key="p.color" class="color-swatch" :class="{ active: readerSettings.bgColor === p.color }" :style="{ background: p.color }" @click="setBgColor(p.color)" :title="p.label"></button>
            </div>
          </div>
          <div class="setting-row">
            <label>字体色</label>
            <div class="color-swatches">
              <button v-for="p in textPresets" :key="p.color" class="color-swatch text-swatch" :class="{ active: readerSettings.textColor === p.color }" :style="{ background: p.color }" @click="setTextColor(p.color)" :title="p.label"></button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== Layout ===== */
.novel-detail {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* 【修改1】阅读模式下强制占满视口，禁止整页弹性滚动 */
.novel-detail.reader-mode {
  max-width: 100%;
  height: 100vh;
  height: 100dvh; /* 使用动态视口高度，解决手机浏览器地址栏收起时的留白问题 */
  overflow: hidden; 
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: var(--card-bg);
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 14px;
  color: var(--accent);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.back-btn:hover { background: var(--accent-bg); }

.header-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
}

.settings-btn:hover, .settings-btn.active { background: var(--accent-bg); color: var(--accent); }

/* ===== Loading / Empty / Error ===== */
.loading-state, .empty-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}

.error-state { color: #c62828; }

.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ===== List Mode ===== */
.list-view { flex: 1; padding: 16px; }

.chapter-grid { display: flex; flex-direction: column; gap: 8px; }

.chapter-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; transition: all 0.15s; text-align: left;
  width: 100%; font-family: inherit; font-size: inherit;
}

.chapter-card:hover { background: var(--accent-bg); border-color: var(--accent); }

.chapter-card-title {
  font-size: 15px; font-weight: 500; color: var(--text);
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.chapter-card-meta { font-size: 12px; color: var(--text-muted); flex-shrink: 0; margin-left: 12px; }

/* ===== Reader Mode (原生滚动重构) ===== */
.reader-view {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
}

/* 【修改2】增加底部 padding，防止最后几行字被固定导航栏遮挡 */
.reader-content-wrapper {
  flex: 1; overflow-y: auto; padding: 24px 16px 100px 16px; /* 底部留出 100px 安全距离 */
  transition: background 0.3s, color 0.3s;
  -webkit-overflow-scrolling: touch; /* iOS 顺滑滚动 */
}

.reader-content-inner {
  max-width: 800px;
  margin: 0 auto;
}

.reader-chapter-title {
  text-align: center; font-weight: 600; margin: 0 0 24px; opacity: 0.9;
}

.text-paragraph {
  margin: 0 0 1.5em; 
  text-indent: 2em;   
  white-space: pre-wrap;
  word-break: break-word;
}

.reader-end-marker {
  text-align: center; margin-top: 3em; opacity: 0.4; font-size: 0.9em;
}

/* ===== Reader Navigation (吸底重构) ===== */
/* 【修改3】使用 fixed 强制吸附在屏幕底部 */
.reader-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 10px 16px; border-top: 1px solid var(--border);
  background: var(--card-bg); 
  padding-bottom: calc(10px + env(safe-area-inset-bottom)); /* 适配 iPhone 底部小黑条 */
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05); /* 加点阴影，区分内容区 */
}

.nav-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 10px 16px;
  border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg);
  color: var(--text); font-size: 14px; cursor: pointer; font-family: inherit;
}

.nav-btn:hover:not(:disabled) { background: var(--accent-bg); border-color: var(--accent); }
.nav-btn:disabled { opacity: 0.3; cursor: default; }
.toc-btn { min-width: 80px; justify-content: center; }

/* ===== Settings Panel ===== */
.settings-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4); z-index: 90;
}

.settings-panel {
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 100; background: var(--card-bg);
  border-top-left-radius: 16px; border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  padding-bottom: env(safe-area-inset-bottom);
}

.settings-handle {
  width: 40px; height: 4px; background: var(--border);
  border-radius: 2px; margin: 12px auto 8px;
}

.settings-inner {
  max-width: 600px; margin: 0 auto; padding: 0 20px 20px;
  display: flex; flex-direction: column; gap: 16px;
}

.setting-row { display: flex; align-items: center; justify-content: space-between; }
.setting-row label { font-size: 14px; font-weight: 500; color: var(--text); min-width: 50px; }
.setting-controls { display: flex; align-items: center; gap: 12px; }

.setting-btn {
  width: 36px; height: 32px; border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg); color: var(--text); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.setting-btn:hover { background: var(--accent-bg); border-color: var(--accent); }

.setting-value { font-size: 14px; font-weight: 600; min-width: 30px; text-align: center; color: var(--text); }

.color-swatches { display: flex; gap: 10px; }
.color-swatch {
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.15s, border-color 0.15s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.active { border-color: var(--accent); transform: scale(1.15); }
.text-swatch { border-radius: 4px; }

/* ===== Transitions ===== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

/* ===== Mobile ===== */
@media (max-width: 640px) {
  .list-view { padding: 12px 8px; }
  .chapter-card { padding: 12px; }
  .reader-content-wrapper { padding: 16px 12px 100px 12px; }
  .nav-btn { padding: 8px 12px; font-size: 13px; }
}
</style>
