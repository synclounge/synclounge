import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

// Good guide: https://blog.sqreen.com/authentication-best-practices-vue/

// ==================== Router registration ====================
export default new Router({
  base: process.env.BASE_URL,
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: () => import('../components/createroom.vue'),
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
      component: () => import('../components/signin.vue'),
    },
    {
      path: '/signout',
      component: () => import('../components/signout.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/join/:server/:room/:password?',
      meta: {
        requiresAuth: true,
        redirectAfterAuth: true,
      },
      component: () => import('../components/join.vue'),
      props: true,
      name: 'join',
    },
    {
      path: '/clientselect',
      component: () => import('../components/application/walkthrough.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/clientpicker',
      name: 'ClientPicker',
      component: () => import('../components/clientpicker.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/joinroom',
      component: () => import('../components/application/joinroom.vue'),
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
      component: () => import('../components/application/slplayer.vue'),
    },
    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'nowplaying',
      props: true,
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },

    {
      path: '/browse',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'browse',
      component: () => import('../components/application/plexbrowser.vue'),
    },
    {
      path: '/browse/:machineIdentifier',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'server',
      props: true,
      component: () => import('../components/application/plexbrowser/plexserver.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      props: true,
      name: 'library',
      component: () => import('../components/application/plexbrowser/plexlibrary.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'movie',
      props: true,
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'series',
      props: true,
      component: () => import('../components/application/plexbrowser/plexseries.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:parentRatingKey/:ratingKey',
      meta: {
        requiresAuth: true,
        protected: true,
      },
      name: 'season',
      props: true,
      component: () => import('../components/application/plexbrowser/plexseason.vue'),
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
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
  ],
});
