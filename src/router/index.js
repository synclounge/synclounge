import Vue from 'vue';
import Router from 'vue-router';
// ===================== Pages Components ======================
import signin from '../components/signin';
import signout from '../components/signout';
import join from '../components/join';

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
      component: signin,
    },
    {
      path: '/signout',
      meta: {},
      component: signout,
    },
    {
      path: '/join',
      meta: {
        protected: false,
      },
      component: join,
    },
    {
      path: '/clientselect',
      meta: {},
      component: require('../components/application/walkthrough.vue'),
    },
    {
      path: '/joinroom',
      meta: {},
      component: require('../components/application/joinroom.vue'),
    },

    {
      path: '/player',
      meta: {
        protected: true,
      },
      component: require('../components/application/ptplayer.vue'),
    },
    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'nowplaying',
      component: require('../components/application/plexbrowser/plexcontent.vue'),
    },

    {
      path: '/browse',
      meta: {
        protected: true,
      },
      name: 'browse',
      component: require('../components/application/plexbrowser.vue'),
    },
    {
      path: '/browse/:machineIdentifier',
      meta: {
        protected: true,
      },
      name: 'server',
      component: require('../components/application/plexbrowser/plexserver.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId',
      meta: {
        protected: true,
      },
      name: 'library',
      component: require('../components/application/plexbrowser/plexlibrary.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: require('../components/application/plexbrowser/plexcontent.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'series',
      component: require('../components/application/plexbrowser/plexseries.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'season',
      component: require('../components/application/plexbrowser/plexseason.vue'),
    },
    {
      path: '/browse/:machineIdentifier/:sectionId/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: require('../components/application/plexbrowser/plexcontent.vue'),
    },
    {
      path: '/browse/:machineIdentifier/tv/:grandparentKey/:parentKey/:ratingKey',
      meta: {
        protected: true,
      },
      name: 'content',
      component: require('../components/application/plexbrowser/plexcontent.vue'),
    },
  ],
});
