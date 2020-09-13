import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'RoomCreation',
      component: () => import('@/views/RoomCreation.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/signin',
      name: 'SignIn',
      component: () => import('@/views/SignIn.vue'),
      meta: {
        requiresNoAuth: true,
      },
    },

    {
      path: '/signout',
      name: 'SignOut',
      component: () => import('@/views/SignOut.vue'),
      meta: {
        requiresPlexToken: true,
      },
    },

    {
      path: '/join/:room/:server?',
      name: 'RoomJoin',
      component: () => import('@/views/RoomJoin.vue'),
      props: true,
      meta: {
        requiresAuth: true,
        redirectAfterAuth: true,
      },
    },

    {
      path: '/clientselect',
      name: 'AdvancedRoomWalkthrough',
      component: () => import('@/views/AdvancedRoomWalkthrough.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/joinroom',
      name: 'AdvancedRoomJoin',
      component: () => import('@/views/AdvancedRoomJoin.vue'),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/player',
      name: 'WebPlayer',
      component: () => import('@/views/WebPlayer.vue'),
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/nowplaying/:machineIdentifier/:ratingKey',
      name: 'NowPlaying',
      component: () => import('@/views/PlexMedia.vue'),
      props: true,
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/browse',
      name: 'PlexHome',
      component: () => import('@/views/PlexHome.vue'),
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/browse/:machineIdentifier',
      name: 'PlexServer',
      component: () => import('@/views/PlexServer.vue'),
      props: true,
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/library/:machineIdentifier/:sectionId',
      name: 'PlexLibrary',
      components: {
        default: () => import('@/views/PlexLibrary.vue'),
        appBarView: () => import('@/components/LibraryViewButton.vue'),
      },
      props: {
        default: true,
      },
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/browse/:machineIdentifier/:ratingKey',
      name: 'PlexMedia',
      component: () => import('@/views/PlexMedia.vue'),
      props: true,
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },
  ],
});
