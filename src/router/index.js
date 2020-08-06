import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

// Good guide: https://blog.sqreen.com/authentication-best-practices-vue/

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: () => import('@/views/createroom.vue'),
      name: 'CreateRoom',
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/signin',
      name: 'Signin',
      meta: {
        requiresNoAuth: true,
      },
      component: () => import('@/views/signin.vue'),
    },

    {
      path: '/signout',
      component: () => import('@/views/signout.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/join/:server?/:room/:password?',
      meta: {
        requiresAuth: true,
        redirectAfterAuth: true,
      },
      component: () => import('@/views/join.vue'),
      props: true,
      name: 'join',
    },

    {
      path: '/clientselect',
      component: () => import('@/views/walkthrough.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/joinroom',
      component: () => import('@/views/joinroom.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/player',
      name: 'player',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      component: () => import('@/views/slplayer.vue'),
    },

    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'nowplaying',
      props: true,
      component: () => import('@/views/plexbrowser/plexcontent.vue'),
    },

    {
      path: '/browse',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'browse',
      component: () => import('@/views/plexbrowser/plexbrowser.vue'),
    },

    {
      path: '/browse/:machineIdentifier',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'server',
      props: true,
      component: () => import('@/views/plexbrowser/plexserver.vue'),
    },

    {
      path: '/browse/:machineIdentifier/:sectionId',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      props: true,
      name: 'library',
      component: () => import('@/views/plexbrowser/plexlibrary.vue'),
    },

    {
      path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'movie',
      props: true,
      component: () => import('@/views/plexbrowser/plexcontent.vue'),
    },

    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'series',
      props: true,
      component: () => import('@/views/plexbrowser/plexseries.vue'),
    },

    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:parentRatingKey/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'season',
      props: true,
      component: () => import('@/views/plexbrowser/plexseason.vue'),
    },

    {
      path:
      '/browse/:machineIdentifier/:sectionId/tv/:grandparentRatingKey/:parentRatingKey/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'content',
      props: true,
      component: () => import('@/views/plexbrowser/plexcontent.vue'),
    },
  ],
});
