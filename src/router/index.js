import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const searchBar = () => import('@/components/SearchBar.vue');
const rightSidebar = () => import('@/components/TheSidebarRight.vue');
const rightSidebarButton = () => import('@/components/TheSidebarRightButton.vue');

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
      path: '*',
      redirect: {
        name: 'RoomCreation',
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
      path: '/room/:room/player/:server?',
      name: 'WebPlayer',
      components: {
        default: () => import('@/views/WebPlayer.vue'),
        rightSidebar,
        rightSidebarButton,
      },
      meta: {
        requiresAuth: true,
        protected: true,
      },
    },

    {
      path: '/room/:room/browse/:server?',
      name: 'PlexHome',
      components: {
        default: () => import('@/views/PlexHome.vue'),
        searchBar,
        rightSidebar,
        rightSidebarButton,
      },
      meta: {
        requiresAuth: true,
        protected: true,
        showAppBarExtension: true,
      },
    },

    {
      path: '/room/:room/browse/server/:machineIdentifier/:server?',
      name: 'PlexServer',
      components: {
        default: () => import('@/views/PlexServer.vue'),
        searchBar,
        rightSidebar,
        rightSidebarButton,
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
      path: '/room/:room/browse/server/:machineIdentifier/library/:sectionId/:server?',
      name: 'PlexLibrary',
      components: {
        default: () => import('@/views/PlexLibrary.vue'),
        searchBar,
        appBarView: () => import('@/components/LibraryViewButton.vue'),
        rightSidebar,
        rightSidebarButton,
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
      path: '/room/:room/browse/server/:machineIdentifier/ratingKey/:ratingKey/:server?',
      name: 'PlexMedia',
      components: {
        default: () => import('@/views/PlexMedia.vue'),
        searchBar,
        rightSidebar,
        rightSidebarButton,
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
      path: '/room/:room/search/:query/:server?',
      name: 'PlexSearch',
      components: {
        default: () => import('@/views/PlexSearch.vue'),
        searchBar,
        rightSidebar,
        rightSidebarButton,
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
