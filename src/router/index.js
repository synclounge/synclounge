import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store';

Vue.use(Router);

// Good guide: https://blog.sqreen.com/authentication-best-practices-vue/


const ifNotAuthenticated = (to, from, next) => {
  if (!store.getters.IS_AUTHENTICATED) {
    next();
    return;
  }
  next('/');
};

const ifAuthenticated = (to, from, next) => {
  if (store.getters.IS_AUTHENTICATED) {
    next();
    return;
  }
  next('/signin');
};

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
      name: 'Signin',
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
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/joinroom',
      meta: {
      },
      component: () => import('../components/application/joinroom.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/player',
      meta: {
        protected: true,
      },
      component: () => import('../components/application/slplayer.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'nowplaying',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
      beforeEnter: ifAuthenticated,
    },

    {
      path: '/browse',
      meta: {
        protected: true,
      },
      name: 'browse',
      component: () => import('../components/application/plexbrowser.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/browse/:machineIdentifier',
      meta: {
        protected: true,
      },
      name: 'server',
      component: () => import('../components/application/plexbrowser/plexserver.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/browse/:machineIdentifier/:sectionId',
      meta: {
        protected: true,
      },
      name: 'library',
      component: () => import('../components/application/plexbrowser/plexlibrary.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'series',
      component: () => import('../components/application/plexbrowser/plexseries.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'season',
      component: () => import('../components/application/plexbrowser/plexseason.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path:
        '/browse/:machineIdentifier/:sectionId/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'contentspecific',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
      beforeEnter: ifAuthenticated,
    },
    {
      path:
        '/browse/:machineIdentifier/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'contentnosection',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
      beforeEnter: ifAuthenticated,
    },
  ],
});
