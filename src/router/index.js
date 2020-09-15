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
      path: '/browse',
      name: 'PlexHome',
      components: {
        default: () => import('@/views/PlexHome.vue'),
        searchBar: () => import('@/components/SearchBar.vue'),
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },

    {
      path: '/browse/:machineIdentifier',
      name: 'PlexServer',
      components: {
        default: () => import('@/views/PlexServer.vue'),
        searchBar: () => import('@/components/SearchBar.vue'),
      },
      props: {
        default: true,
        searchBar: true,
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },

    {
      path: '/library/:machineIdentifier/:sectionId',
      name: 'PlexLibrary',
      components: {
        default: () => import('@/views/PlexLibrary.vue'),
        searchBar: () => import('@/components/SearchBar.vue'),
        appBarView: () => import('@/components/LibraryViewButton.vue'),
      },
      props: {
        default: true,
        searchBar: true,
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },

    {
      path: '/browse/:machineIdentifier/:ratingKey',
      name: 'PlexMedia',
      components: {
        default: () => import('@/views/PlexMedia.vue'),
        searchBar: () => import('@/components/SearchBar.vue'),
      },
      props: {
        default: true,
        searchBar: true,
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },

    {
      path: '/search/:query',
      name: 'PlexSearch',
      components: {
        default: () => import('@/views/PlexSearch.vue'),
        searchBar: () => import('@/components/SearchBar.vue'),
      },
      props: {
        default: true,
        searchBar: true,
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },
  ],
});
