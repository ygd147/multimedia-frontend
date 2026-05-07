import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
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
  ],
})

export default router
