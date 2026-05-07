# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (host: true, LAN accessible)
npm run build      # Type-check (vue-tsc -b) then Vite production build
npm run preview    # Preview production build locally
```

## Project Architecture

Vue 3 + TypeScript multimedia resource browser for a personal media server (no auth). Two independent backends proxied via Vite:

```
Vite proxy: /api -> http://192.168.0.100:8000
```

### Two API Modules

- **`src/api/media.ts`** — `/api/media` — serves images (including ZIP archives) and novels
  - Response wrapper: `ApiResponse<T>` with `code: 200` on success
  - `fetchMediaList(params)` — paginated list with `media_type`, `keyword`, `parent_id` filters
  - `fetchMediaDetail(id)` — returns detail with conditional meta (ImageMeta/ZipMeta/NovelMeta/VideoMeta)
  - URL helpers: `getThumbnailUrl`, `getRawUrl`, `getImage`, `getCoverUrl`, `getStreamUrl`, `getChapterUrl`

- **`src/api/video.ts`** — `/api/video` — serves videos with directory tree support
  - Response wrapper: `VideoApiResponse<T>` with `code: 0` on success (different from media API!)
  - `fetchVideoList(params)` — items have `category: 'video' | 'directory'` instead of `media_type`
  - `fetchVideoDetail(id)`, `deleteVideo(id)`, `getVideoStreamUrl(id)`
  - Scan endpoints: `triggerScan()`, `fetchScanStatus()`

### Two Composable Patterns (Not Yet Unified)

- **`src/composables/useMediaList.ts`** — manages list state for image/novel tabs
  - States: `items`, `total`, `loading`, `page`, `perPage`, `keyword`, `parentId`, `dirStack`
  - Functions: `loadData()`, `search(kw)` (300ms debounce), `changePage(n)`, `enterDir(id, name)`, `backToDir(n)`
  - Takes `mediaType: Ref<MediaType | null>` param, re-fetches on type change

- **`src/composables/useVideoList.ts`** — identical pattern but for video API (no `media_type` param)
- **`src/composables/useMediaDetail.ts`** — fetches detail by ID, polls every 3s while `status === 1` (Processing)

### Routing (`src/router/index.ts`)

```
/                  -> Home.vue       (tabs: 漫画/小说/视频, ?tab=N query param)
/detail/:id        -> Detail.vue     (image/ZIP/novel/video metadata)
/video/:id         -> VideoDetail.vue (DPlayer video playback)
```

All routes are lazy-loaded. Tab state is persisted via `route.query.tab`.

### Key Component Relationships

```
App.vue
  └── <router-view>
        ├── Home.vue           — uses BOTH useMediaList + useVideoList, switches via computed
        │     ├── SearchBar.vue
        │     ├── MediaCard.vue  — handles video/image/folder/directory via `category` and `is_dir`
        │     └── Pagination.vue
        ├── Detail.vue         — uses useMediaDetail, conditionally renders:
        │     ├── StatusBadge.vue
        │     └── ImageCarousel.vue  — waterfall gallery + fullscreen preview lightbox
        └── VideoDetail.vue    — uses fetchVideoDetail, renders:
              └── VideoPlayer.vue    — DPlayer wrapper (onMounted init, onUnmounted destroy)
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
