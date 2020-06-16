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
          @success="sendNotification()"
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
          v-if="showRightDrawerButton"
          class="clickable"
          @click="TOGGLE_RIGHT_SIDEBAR_OPEN"
        >
          {{
            isRightSidebarOpen ? 'last_page' : 'first_page'
          }}
        </v-icon>
      </v-toolbar-items>
    </v-app-bar>

    <v-main
      :style="mainStyle"
      app
    >
      <v-container
        align-start
        class="ma-0 pa-0"
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

        <template
          v-else
        >
          <v-breadcrumbs
            v-if="crumbs && crumbs.length > 0"
            :items="crumbs"
            class="text-xs-left"
            style="justify-content: left"
          >
            <template v-slot:divider>
              <v-icon>chevron_right</v-icon>
            </template>

            <template v-slot:item="props">
              <v-breadcrumbs-item
                :to="props.item.to"
                :exact="true"
              >
                {{
                  props.item.text
                }}
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>

          <router-view />
        </template>

        <v-snackbar
          v-model="snackbar"
          color="green darken-2"
          bottom
          :timeout="4000"
        >
          <div style="text-align:center; width:100%">
            {{ snackbarMsg }}
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

import { mapActions, mapGetters, mapState } from 'vuex';
import fscreen from 'fscreen';

export default {
  components: {
    rightsidebar: () => import('./components/sidebar.vue'),
    upnext: () => import('./components/upnext.vue'),
    nowplayingchip: () => import('./components/nowplayingchip.vue'),
    leftsidebar: () => import('./components/leftsidebar.vue'),
    donate: () => import('./components/donate.vue'),
  },

  data() {
    return {
      fixed: false,
      initialized: false,
      donateDialog: false,

      snackbar: false,
      snackbarMsg: false,

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
      appIsFullscreen: false,
    };
  },

  computed: {
    ...mapGetters([
      'getItemCache',
      'getLibraryCache',
      'getConnected',
      'getRoom',
      'getServer',
      'getShortLink',
      'GET_SYNCLOUNGE_SERVERS',
      'GET_UP_NEXT_POST_PLAY_DATA',
      'getLogos',
      'IS_DONE_FETCHING_DEVICES',
      'IS_AUTHENTICATED',
      'GET_CONFIG',
      'GET_CONFIGURATION_FETCHED',
      'GET_CONFIGURATION_FETCHED_ERROR',
    ]),
    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_CLIENT_PLAYING_METADATA',
    ]),
    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),
    ...mapState(['isRightSidebarOpen']),

    crumbs() {
      if (
        this.$route.path.indexOf('browse') === -1
        && this.$route.path.indexOf('nowplaying') === -1
      ) {
        return [];
      }
      const getTitle = (ratingKey) => {
        try {
          console.log(ratingKey);
          console.log(this.getItemCache[this.$route.params.machineIdentifier]);
          return this.getItemCache[this.$route.params.machineIdentifier][ratingKey].title;
        } catch (e) {
          return 'Loading..';
        }
      };
      const getLibrary = (id) => {
        try {
          return this.getLibraryCache[this.$route.params.machineIdentifier][id];
        } catch (e) {
          return 'Library';
        }
      };
      const data = [
        {
          text: 'Home',
          to: '/browse',
        },
      ];

      const map = {
        machineIdentifier: () => ({
          text: this.GET_PLEX_SERVER(this.$route.params.machineIdentifier).name,
          to: `/browse/${this.$route.params.machineIdentifier}`,
        }),

        sectionId: () => ({
          text: getLibrary(this.$route.params.sectionId),
          to: `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}`,
        }),

        parentRatingKey: () => {
          let to;
          if (this.$route.params.grandparentRatingKey) {
            to = `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.grandparentRatingKey}/${this.$route.params.parentRatingKey}`;
          } else {
            to = `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.parentRatingKey}`;
          }
          return {
            text: getTitle(this.$route.params.parentRatingKey),
            to,
          };
        },
        grandparentRatingKey: () => ({
          text: getTitle(this.$route.params.grandparentRatingKey),
          to: `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.grandparentRatingKey}/`,
        }),

        ratingKey: () => ({
          text: getTitle(this.$route.params.ratingKey),
          to: `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/${this.$route.params.ratingKey}`,
        }),
      };

      Object.keys(this.$route.params).forEach((param) => {
        const link = map[param]();
        if (link) {
          data.push(link);
        }
      });
      return data;
    },

    showNowPlaying() {
      return this.GET_CLIENT_PLAYING_METADATA && this.$route.name === 'browse';
    },

    showRightDrawerButton() {
      return this.getConnected && this.getRoom;
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
      if (this.getServer && this.getRoom) {
        if (this.GET_CONFIG.autoJoin) {
          // If autojoin, just link to main site
          return window.location.origin;
        }

        const invitePart = this.$router.resolve({
          name: 'join',
          params: { server: this.getServer, room: this.getRoom },
        }).href;

        return `${window.location.origin}/${invitePart}`;
      }
      return '';
    },
  },

  watch: {
    showRightDrawerButton() {
      // TODO: fix this is hacky
      if (this.showRightDrawerButton) {
        this.SET_RIGHT_SIDEBAR_OPEN(true);
      }
    },
  },

  mounted() {
    window.EventBus.$on('notification', (msg) => {
      this.snackbarMsg = msg;
      this.snackbar = true;
    });

    window.EventBus.$on('NEW_TIMELINE', (timeline) => {
      this.$store.dispatch('NEW_TIMELINE', timeline);
    });

    window.EventBus.$on('PLAYBACK_CHANGE', (data) => {
      if (this.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10' && data[1]) {
        this.$router.push(`/nowplaying/${data[2].machineIdentifier}/${data[1]}`);
      }

      if (
        this.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10'
        && !data[1]
        && this.$route.fullPath.indexOf('/nowplaying') > -1
      ) {
        this.$router.push('/browse/');
      }
      this.$store.dispatch('PLAYBACK_CHANGE', data);
    });

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
      'FETCH_PLEX_DEVICES_IF_NEEDED',
      'FETCH_PLEX_USER',
      'FETCH_CONFIG',
    ]),

    sendNotification() {
      window.EventBus.$emit('notification', 'Copied to clipboard');
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
