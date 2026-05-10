import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior(to, from, savedPosition) {
    // 这应该解决后退问题
    if (to.hash) {
      return { el: to.hash }
    } else if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      component: () => import('../views/Home.vue'),
      children: [
        { path: '', name: 'comic', component: () => import('../views/ComicExplorer.vue') },
        { path: 'novel', name: 'novel', component: () => import('../components/NovelExplorer.vue') },
        { path: 'video', name: 'video', component: () => import('../views/VideoExplorer.vue') },
      ],
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('../views/Detail.vue'),
    },
    {
      path: '/video/:id',
      name: 'video-detail',
      component: () => import('../views/VideoDetail.vue'),
    },
    {
      path: '/novel/:id',
      name: 'novel-detail',
      component: () => import('../views/NovelDetail.vue'),
    },
  ],
})

export default router
