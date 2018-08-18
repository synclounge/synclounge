import Vue from 'vue'
import Router from 'vue-router'
// ===================== Pages Components ======================
import signin from '../components/signin'
import signout from '../components/signout'
import join from '../components/join'

let SettingsHelper = require('../../SettingsHelper.js')
let settings = new SettingsHelper()

Vue.use(Router)

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  base: settings.webroot || '/',
  routes: [{
    path: '/',
    meta: {
      protected: true
    }
  },
  {
    path: '/signin',
    meta: {
      noload: true
    },
    component: signin
  },
  {
    path: '/signout',
    meta: {
      noload: true
    },
    component: signout
  },
  {
    path: '/join',
    meta: {
      noload: true,
      protected: false
    },
    component: join
  },
  {
    path: '/clientselect',
    meta: {
      noload: false
    },
    component: require('../components/application/walkthrough.vue').default
  },
  {
    path: '/joinroom',
    meta: {
      noload: false
    },
    component: require('../components/application/joinroom.vue').default
  },

  {
    path: '/player',
    meta: {
      protected: true
    },
    component: require('../components/application/ptplayer.vue').default
  },
  {
    path: '/nowplaying/:machineIdentifier/:ratingKey',
    meta: {
      protected: true
    },
    name: 'nowplaying',
    component: require('../components/application/plexbrowser/plexcontent.vue').default
  },

  {
    path: '/browse',
    meta: {
      protected: true
    },
    name: 'browse',
    component: require('../components/application/plexbrowser.vue').default
  },
  {
    path: '/browse/:machineIdentifier',
    meta: {
      protected: true
    },
    name: 'server',
    component: require('../components/application/plexbrowser/plexserver.vue').default
  },
  {
    path: '/browse/:machineIdentifier/:sectionId',
    meta: {
      protected: true
    },
    name: 'library',
    component: require('../components/application/plexbrowser/plexlibrary.vue').default
  },
  {
    path: '/browse/:machineIdentifier/:sectionId/:ratingKey',
    meta: {
      protected: true
    },
    name: 'content',
    component: require('../components/application/plexbrowser/plexcontent.vue').default
  },
  {
    path: '/browse/:machineIdentifier/:sectionId/tv/:ratingKey',
    meta: {
      protected: true
    },
    name: 'series',
    component: require('../components/application/plexbrowser/plexseries.vue').default
  },
  {
    path: '/browse/:machineIdentifier/:sectionId/tv/:parentKey/:ratingKey',
    meta: {
      protected: true
    },
    name: 'season',
    component: require('../components/application/plexbrowser/plexseason.vue').default
  },
  {
    path: '/browse/:machineIdentifier/:sectionId/tv/:grandparentKey/:parentKey/:ratingKey',
    meta: {
      protected: true
    },
    name: 'content',
    component: require('../components/application/plexbrowser/plexcontent.vue').default
  },
  {
    path: '/browse/:machineIdentifier/tv/:grandparentKey/:parentKey/:ratingKey',
    meta: {
      protected: true
    },
    name: 'content',
    component: require('../components/application/plexbrowser/plexcontent.vue').default
  }
  ]
})
