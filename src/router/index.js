import Vue from 'vue'
import Router from 'vue-router'
// ===================== Pages Components ======================
import signin from '../components/signin'
import signout from '../components/signout'
import home from '../components/home'
import application from '../components/application'
import join from '../components/join'

Vue.use(Router)

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  base: '/ptweb/',
  routes: [
    { path: '/', meta: { protected: true } },
    { path: '/signin', component: signin },
    { path: '/signout', component: signout },
    { path: '/join', component: join },
    { path: '/clientselect', component: require('../components/application/walkthrough.vue') },
    { path: '/joinroom', component: require('../components/application/joinroom.vue') },

    { path: '/player', component: require('../components/application/ptplayer.vue') },

    
    { path: '/browse/', 
      meta: { protected: true }, 
      name: 'browse', 
      children: [
        {
          path: '', component: require('../components/application/plexbrowser.vue')
        },
        { 
          path: ':machineIdentifier', name: 'server', component: require('../components/application/plexbrowser/plexserver.vue'),
          children: [
            { path: 'library/:sectionid', name: 'library', component: require('../components/application/plexbrowser/plexlibrary.vue') },
            { path: ':ratingKey', name: 'content', component: require('../components/application/plexbrowser/plexcontent.vue') },
          ] 
        }
      ] 
    }
  ]
})
