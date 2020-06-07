import Vue from 'vue';
import Router from 'vue-router';
// ===================== Pages Components ======================

Vue.use(Router);

// ==================== Router registration ====================
export default new Router({
  base: process.env.webroot,
  mode: 'hash',
  routes: [
    {
      path: '/',
      meta: {
        protected: true,
      },
    },
    {
      path: '/signin',
      meta: {},
      component: () => import('../components/signin.vue'),
    },
    {
      path: '/signout',
      meta: {},
      component: () => import('../components/signout.vue'),
    },
    {
      path: '/join',
      meta: {
        protected: false,
      },
      component: () => import('../components/join.vue'),
    },
    {
      path: '/clientselect',
      meta: {
      },
      component: () => import('../components/application/walkthrough.vue'),
    },
    {
      path: '/joinroom',
      meta: {
      },
      component: () => import('../components/application/joinroom.vue'),
    },
    {
      path: '/player',
      meta: {
        protected: true,
      },
      component: () => import('../components/application/slplayer.vue'),
    },
    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'nowplaying',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },

    {
      path: '/browse',
      meta: {
        protected: true,
      },
      name: 'browse',
      component: () => import('../components/application/plexbrowser.vue'),
    },
    {
      path: '/browse/:machineIdentifier',
      meta: {
        protected: true,
      },
      name: 'server',
      component: () => import('../components/application/plexbrowser/plexserver.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId',
      meta: {
        protected: true,
      },
      name: 'library',
      component: () => import('../components/application/plexbrowser/plexlibrary.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'series',
      component: () => import('../components/application/plexbrowser/plexseries.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'season',
      component: () => import('../components/application/plexbrowser/plexseason.vue'),
    },
    {
      path:
        '/browse/:machineIdentifier/:sectionId/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'contentspecific',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
  ],
});
