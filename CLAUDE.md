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

### Three Composable Patterns (Not Yet Unified)

- **`src/composables/useMediaList.ts`** — manages list state for the image tab only
  - States: `items`, `total`, `loading`, `page`, `perPage`, `keyword`, `parentId`, `dirStack`
  - Functions: `loadData()`, `search(kw)` (300ms debounce), `changePage(n)`, `enterDir(id, name)`, `backToDir(n)`
  - Takes `mediaType: Ref<MediaType | null>` param, re-fetches on type change

- **`src/composables/useVideoList.ts`** — identical pattern using video API (no `media_type` param)
- **`src/composables/useNovelList.ts`** — identical pattern using novel API
- **`src/composables/useMediaDetail.ts`** — fetches detail by ID, polls every 3s while `status === 1` (Processing)

### Routing (`src/router/index.ts`)

```
/                  -> Home.vue       (tabs: 漫画/小说/视频, ?tab=N query param)
/detail/:id        -> Detail.vue     (image/ZIP metadata + carousel)
/video/:id         -> VideoDetail.vue (DPlayer video playback + episode list)
/novel/:id         -> NovelDetail.vue (chapter sidebar + virtual-scroll reader)
```

All routes are lazy-loaded. Tab state is persisted via `route.query.tab`.

### Key Component Relationships

```
App.vue
  └── <router-view>
        ├── Home.vue           — uses ALL THREE composables (media/video/novel), switches via computed
        │     ├── SearchBar.vue
        │     ├── MediaCard.vue  — handles video/image/novel/folder via `category`, `media_type`, `is_dir`
        │     └── Pagination.vue
        ├── Detail.vue         — uses useMediaDetail, conditionally renders:
        │     ├── StatusBadge.vue
        │     └── ImageCarousel.vue  — waterfall gallery + fullscreen preview lightbox
        ├── VideoDetail.vue    — uses fetchVideoDetail, renders:
        │     └── VideoPlayer.vue    — DPlayer wrapper (exposes switchVideo, loadSubtitle, toggleSubtitle)
        └── NovelDetail.vue    — uses fetchChapters + fetchChapterContent, renders:
              ├── chapter sidebar (scrollable list)
              └── virtual-scroll reader (only visible lines in DOM, avoids OOM on huge content)
```

### Directory Navigation Pattern

List views use lazy-load directory tree via `parent_id`. A `dirStack` array acts as breadcrumb:

```
Root -> enterDir(1, "folder") -> enterDir(2, "subfolder") -> backToDir(0) -> backToDir(-1)
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
