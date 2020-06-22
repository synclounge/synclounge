<template>
  <v-app>
    <leftsidebar />
    <rightsidebar />

    <v-app-bar
      app
      scroll-off-screen
      :scroll-threshold="1"
      style="z-index: 5"
    >
      <v-app-bar-nav-icon @click="SET_LEFT_SIDEBAR_OPEN" />
      <a
        href="https://synclounge.tv"
        target="_blank"
      >
        <img
          class="ma-1 hidden-xs-only"
          style="height: 42px; width: auto; vertical-align: middle"
          :src="getLogos.light.long"
        >

        <img
          class="ma-1 hidden-sm-and-up"
          style="height: 42px; width: auto; vertical-align: middle"
          :src="getLogos.light.small"
        >
      </a>

      <nowplayingchip
        v-if="showNowPlaying"
        class="pl-4"
      />

      <v-spacer />

      <v-toolbar-items>
        <v-btn
          v-if="inviteUrl"
          v-clipboard="inviteUrl"
          color="primary"
          dark
          raised
          @success="onInviteCopied"
        >
          Invite
        </v-btn>

        <v-btn
          dark
          class="hidden-lg-and-up"
          icon
          @click="goFullscreen"
        >
          <v-icon>fullscreen</v-icon>
        </v-btn>

        <v-btn
          v-for="item in links"
          :key="item.title"
          small
          tag="a"
          class="hidden-sm-and-down"
          text
          :href="item.href"
          :target="item.target"
        >
          {{ item.title }}
        </v-btn>

        <v-btn
          small
          tag="a"
          class="hidden-sm-and-down"
          text
          @click="donateDialog = true"
        >
          Donate ♥
        </v-btn>

        <v-icon
          v-if="GET_ROOM"
          class="clickable"
          @click="TOGGLE_RIGHT_SIDEBAR_OPEN"
        >
          {{
            isRightSidebarOpen ? 'last_page' : 'first_page'
          }}
        </v-icon>
      </v-toolbar-items>

      <template
        v-if="showCrumbs"
        v-slot:extension
      >
        <crumbs />
      </template>
    </v-app-bar>

    <v-main
      :style="mainStyle"
      app
    >
      <v-container
        align="start"
        :style="containerStyle"
        style="height: 100%"
        fluid
      >
        <v-alert
          v-if="GET_CONFIGURATION_FETCHED_ERROR"
          width="100%"
          :dismissible="true"
          type="error"
          class="mt-0 mb-0"
        >
          Failed to fetch config: {{ GET_CONFIGURATION_FETCHED_ERROR }}
        </v-alert>

        <v-container
          v-if="((GET_CONFIG.fetchConfig && !GET_CONFIGURATION_FETCHED)
            || !IS_DONE_FETCHING_DEVICES) && $route.matched.some((record) => record.meta.protected)"
          fill-height
        >
          <v-row
            justify="center"
            align="center"
            class="pt-4 text-center"
          >
            <v-col>
              <v-progress-circular
                indeterminate
                :size="60"
                class="amber--text"
              />
            </v-col>
          </v-row>
        </v-container>

        <router-view v-else />

        <v-snackbar
          :value="GET_SNACKBAR_OPEN"
          color="green darken-2"
          bottom
          :timeout="4000"
          @input="SET_SNACKBAR_OPEN"
        >
          <div style="text-align:center; width:100%">
            {{ GET_SNACKBAR_MESSAGE }}
          </div>
        </v-snackbar>

        <upnext v-if="GET_UP_NEXT_POST_PLAY_DATA" />

        <v-dialog
          v-model="donateDialog"
          max-width="650px"
        >
          <donate
            :donate-dialog="donateDialog"
            :on-close="donateDialog = false"
          />
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
// Custom css
import './assets/css/style.css';

import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import fscreen from 'fscreen';

export default {
  components: {
    rightsidebar: () => import('@/components/sidebar.vue'),
    upnext: () => import('@/components/upnext.vue'),
    nowplayingchip: () => import('@/components/nowplayingchip.vue'),
    leftsidebar: () => import('@/components/leftsidebar.vue'),
    donate: () => import('@/components/donate.vue'),
    crumbs: () => import('@/components/crumbs.vue'),
  },

  data() {
    return {
      donateDialog: false,
      appIsFullscreen: false,

      items: [
        {
          title: 'Preferences',
        },
        {
          title: 'Signout',
        },
      ],

      links: [
        {
          title: 'Github',
          href: 'https://github.com/samcm/SyncLounge',
          target: '_blank',
        },
        {
          title: 'Discord',
          target: '_blank',
          href: 'https://discord.gg/fKQB3yt',
        },
      ],
    };
  },

  computed: {
    ...mapGetters([
      'GET_UP_NEXT_POST_PLAY_DATA',
      'getLogos',
      'GET_CONFIG',
      'GET_CONFIGURATION_FETCHED',
      'GET_CONFIGURATION_FETCHED_ERROR',
      'GET_ACTIVE_METADATA',
      'GET_SNACKBAR_MESSAGE',
      'GET_SNACKBAR_OPEN',
    ]),

    ...mapGetters('plex', [
      'IS_AUTHENTICATED',
      'IS_DONE_FETCHING_DEVICES',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_SERVER_ID',
      'GET_PLEX_CLIENT_TIMELINE',
    ]),

    ...mapGetters('synclounge', [
      'GET_ROOM',
      'GET_SERVER',
    ]),

    ...mapState(['isRightSidebarOpen']),

    showNowPlaying() {
      return this.GET_ACTIVE_SERVER_ID && this.$route.name === 'browse';
    },

    showCrumbs() {
      // TODO: rewrite this logic but I'm lazy now
      return !(this.$route.path.indexOf('browse') === -1
        && this.$route.path.indexOf('nowplaying') === -1);
    },

    mainStyle() {
      if (this.$store.getters.getBackground !== null) {
        return {
          'background-image': `url(${this.$store.getters.getBackground})`,
          'background-repeat': 'no-repeat',
          'background-size': 'cover',
          'background-position': 'center',
        };
      }
      return {};
    },

    containerStyle() {
      const arr = [];
      if (this.$store.getters.getBackground !== null) {
        arr.push({
          background: 'rgba(0,0,0,0.7)',
        });
      }
      return arr;
    },

    inviteUrl() {
      if (this.GET_ROOM) {
        if (this.GET_CONFIG.autoJoin) {
          // If autojoin, just link to main site
          return window.location.origin;
        }

        const invitePart = this.$router.resolve({
          name: 'join',
          params: { server: this.GET_SERVER, room: this.GET_ROOM },
        }).href;

        return `${window.location.origin}/${invitePart}`;
      }
      return '';
    },
  },

  watch: {
    GET_ROOM() {
      // TODO: fix this is hacky
      if (this.GET_ROOM) {
        this.SET_RIGHT_SIDEBAR_OPEN(true);
      }
    },

    GET_PLEX_CLIENT_TIMELINE() {
      // This handles regular plex clients (nonslplayer) playback changes

    },
  },

  mounted() {
    fscreen.addEventListener('fullscreenchange', () => {
      const isFullscreen = fscreen.fullscreenElement !== null;
      this.appIsFullscreen = isFullscreen;
      document.body.classList.toggle('is-fullscreen', isFullscreen);
    });
  },

  created() {
    if (this.GET_CONFIG.fetchConfig) {
      this.FETCH_CONFIG();
    }

    if (this.IS_AUTHENTICATED) {
      // Kick off a bunch of requests that we need for later
      this.FETCH_PLEX_USER();
      this.FETCH_PLEX_DEVICES_IF_NEEDED();
    }
  },

  methods: {
    ...mapActions([
      'SET_LEFT_SIDEBAR_OPEN',
      'SET_RIGHT_SIDEBAR_OPEN',
      'TOGGLE_RIGHT_SIDEBAR_OPEN',
      'FETCH_CONFIG',
      'DISPLAY_NOTIFICATION',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES_IF_NEEDED',
      'FETCH_PLEX_USER',
    ]),

    ...mapMutations([
      'SET_SNACKBAR_OPEN',
    ]),

    onInviteCopied() {
      return this.DISPLAY_NOTIFICATION('Copied to clipboard');
    },

    goFullscreen() {
      fscreen.requestFullscreen(document.body);
    },
  },
};
</script>

<style>
.a {
  color: unset !important;
  text-decoration: none !important;
}
</style>
