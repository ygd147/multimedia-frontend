# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (host: true, LAN accessible)
npm run build      # Type-check (vue-tsc -b) then Vite production build
npm run preview    # Preview production build locally
```

## Project Architecture

Vue 3 + TypeScript multimedia resource browser for a personal media server (no auth). Three independent API backends proxied via Vite:

```
Vite proxy: /api -> http://192.168.1.100:8000
```

### Three API Modules

- **`src/api/media.ts`** — `/api/media` — serves images (including ZIP archives)
  - Response wrapper: `ApiResponse<T>` with `code: 200` on success
  - `fetchMediaList(params)` — paginated list with `media_type`, `keyword`, `parent_id` filters
  - `fetchMediaDetail(id)` — returns detail with conditional meta (ImageMeta/ZipMeta)
  - URL helpers: `getThumbnailUrl`, `getRawUrl`, `getImage`, `getCoverUrl`, `getStreamUrl`, `getChapterUrl`

- **`src/api/novel.ts`** — `/api/novel` — serves novels with directory tree support
  - Response wrapper: `NovelApiResponse<T>` with `code: 0` on success
  - `fetchNovelList(params)` — items have `is_dir`, `media_type: 2|3` (2=novel, 3=directory)
  - `fetchChapters(novelId)` — returns chapter list with `chapter_order`, `word_count`
  - `fetchChapterContent(chapterId)` — returns full text content (⚠️ can be huge — use virtual list)
  - `deleteNovel(id)` — cascading physical delete

- **`src/api/video.ts`** — `/api/video` — serves videos with directory tree support
  - Response wrapper: `VideoApiResponse<T>` with `code: 0` on success (different from media API!)
  - `fetchVideoList(params)` — items have `category: 'video' | 'directory'` instead of `media_type`
  - `fetchVideoDetail(id)`, `deleteVideo(id)`, `getVideoStreamUrl(id)`
  - Scan endpoints: `triggerScan()`, `fetchScanStatus()`

### Three Composable Patterns

- **`src/composables/useMediaList.ts`** — list state for ComicExplorer (image tab)
  - States: `items`, `total`, `loading`, `page`, `perPage`, `keyword`, `parentId`, `dirStack`
  - Functions: `loadData()`, `search(kw)` (300ms debounce), `changePage(n)`, `enterDir(id, name)`, `backToDir(n)`
  - Takes `mediaType: Ref<MediaType | null>` param, re-fetches on type change

- **`src/composables/useVideoList.ts`** — list state for VideoExplorer (video tab). Same pattern using video API.
- **`src/composables/useNovelList.ts`** — list state for NovelExplorer (novel tab). Same pattern using novel API.
- **`src/composables/useMediaDetail.ts`** — fetches detail by ID, polls every 3s while `status === 1` (Processing)

Each tab explorer owns its composable instance. Composables are not shared across tabs.

### Routing (`src/router/index.ts`)

```
/ (redirects to /comic)   -> Home.vue (layout shell)
  children:
    /comic                 -> ComicExplorer.vue    (image tab)
    /novel                 -> NovelExplorer.vue    (novel tab)
    /video                 -> VideoExplorer.vue    (video tab)
/detail/:id                -> Detail.vue            (image/ZIP metadata + carousel)
/video/:id                 -> VideoDetail.vue       (DPlayer video playback + episode list)
/novel/:id                 -> NovelDetail.vue       (chapter list + reader)
```

All routes are lazy-loaded. Tabs are decoupled as child routes under `/`. The root `/` redirects to `/comic` as default tab. List routes use plain paths without dynamic segments — this avoids ambiguity between `/video/77` (list directory) and `/video/77` (detail page), which Vue Router cannot distinguish if both use `:id`-style params at overlapping paths.

### State Management

Directory navigation (parentId, dirStack), pagination (page), and search (keyword) are managed internally by each tab's composable. Only the **search query** is synced to the URL via `route.query.q` (for shareability). All other state is composable-private and survives tab switches via `<keep-alive>`.

| What | Where | Why |
|------|-------|-----|
| Search query (`q`) | `route.query.q` | Shareable URL, browser back |
| Directory (`parentId`) | Composable ref | Avoids path ambiguity with detail routes |
| Breadcrumb (`dirStack`) | Composable ref | UI-only, no need in URL |
| Page (`page`) | Composable ref | Transient, not worth URL clutter |

**Initial load:** `onMounted` calls `loadData()` directly (no debounce).
**Search:** `watch(() => route.query.q)` calls composable's `search(kw)` (300ms debounce inside composable).
**Directory navigation / pagination:** Call composable methods directly (`enterDir`, `backToDir`, `changePage`). No URL changes.

### Key Component Relationships

```
App.vue
  └── <keep-alive :include="['Home']">
        └── <router-view>
              ├── Home.vue                  — thin layout: header, SearchBar, tab bar
              │     ├── SearchBar.vue       — emits search, Home calls router.replace({ query: { q, page: '1' } })
              │     └── <router-view>       — child tab content (wrapped in <keep-alive>)
              │           ├── ComicExplorer.vue  — watches route → syncs useMediaList(MediaType.Image)
              │           ├── NovelExplorer.vue  — watches route → syncs useNovelList()
              │           └── VideoExplorer.vue  — watches route → syncs useVideoList(), adds video thumbnails
              ├── Detail.vue                — useMediaDetail, conditional render:
              │     ├── StatusBadge.vue
              │     └── ImageCarousel.vue   — waterfall gallery + fullscreen preview lightbox
              ├── VideoDetail.vue           — fetchVideoDetail + tree-style episode list:
              │     └── VideoPlayer.vue     — DPlayer wrapper (exposes switchVideo, loadSubtitle, toggleSubtitle)
              └── NovelDetail.vue           — fetchChapters + fetchChapterContent, dual-mode:
                    ├── chapter list view
                    └── reader view (native scroll, settings panel)
```

### Status Polling Pattern

Media detail page polls `GET /media/:id` every 3 seconds while `status === MediaStatus.Processing(1)`. Stops on Ready(2) or Failed(3) or error.

### Theme

CSS custom properties with light/dark mode via `@media (prefers-color-scheme: dark)`. No CSS framework.

### Important TypeScript Notes

- `erasableSyntaxOnly: false` in `tsconfig.app.json` (allows enums in Vue files)
- `noUnusedLocals: true`, `noUnusedParameters: true` — unused vars cause build errors
- Uses vue-tsc 3.x with TypeScript 6.x — the build pipeline is: `vue-tsc -b && vite build`

### Dependencies

| Package | Purpose |
|---------|---------|
| vue 3.5 | Framework |
| vue-router 5 | SPA routing |
| axios 1.x | HTTP client |
| dplayer 1.27 | Video player |
| @types/dplayer | DPlayer TS types |
| vite 8 | Build tool |
| vue-tsc 3 | Vue type checking |
