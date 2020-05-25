import Vue from 'vue';
import Router from 'vue-router';
// ===================== Pages Components ======================
import signin from '../components/signin.vue';
import signout from '../components/signout.vue';
import join from '../components/join.vue';

const SettingsHelper = require('../../SettingsHelper.js');

const settings = new SettingsHelper();

Vue.use(Router);

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  base: settings.webroot || '/',
  routes: [
    {
      path: '/',
      meta: {
        protected: true,
      },
    },
    {
      path: '/signin',
      meta: {
        noload: true,
      },
      component: signin,
    },
    {
      path: '/signout',
      meta: {
        noload: true,
      },
      component: signout,
    },
    {
      path: '/join',
      meta: {
        noload: true,
        protected: false,
      },
      component: join,
    },
    {
      path: '/clientselect',
      meta: {
        noload: false,
      },
      component: () => import('../components/application/walkthrough.vue'),
    },
    {
      path: '/joinroom',
      meta: {
        noload: false,
      },
      component: () => import('../components/application/joinroom.vue'),
    },

    {
      path: '/player',
      meta: {
        protected: true,
      },
      component: () => import('../components/application/ptplayer.vue'),
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
      name: 'content',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
    {
      path:
        '/browse/:machineIdentifier/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: () => import('../components/application/plexbrowser/plexcontent.vue'),
    },
  ],
});
