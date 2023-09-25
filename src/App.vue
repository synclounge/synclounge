<template>
  <v-app>
    <TheSidebarLeft />
    <router-view name="rightSidebar" />

    <v-app-bar
      app
      scroll-off-screen
      :scroll-threshold="1"
      style="z-index: 5;"
    >
      <v-app-bar-nav-icon @click="SET_LEFT_SIDEBAR_OPEN" />

      <router-link
        :to="{ name: 'RoomCreation' }"
      >
        <picture>
          <source
            srcset="@/assets/images/logos/logo-small-light.png"
            :media="smallLogoMedia"
          >
          <img
            height="42"
            src="@/assets/images/logos/logo-long-light.png"
            style="vertical-align: middle;"
          >
        </picture>
      </router-link>

      <TheNowPlayingChip
        v-if="showNowPlaying"
        class="pl-4"
      />

      <v-spacer />

      <v-toolbar-items>
        <v-btn
          v-if="inviteUrl"
          color="primary"
          raised
          @click="copyToClipboard(inviteUrl)"
        >
          Invite
        </v-btn>

        <v-btn
          class="hidden-lg-and-up"
          icon
          @click="toggleFullScreen"
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

        <DonateDialog v-slot="{ on, attrs }">
          <v-btn
            small
            class="hidden-sm-and-down"
            text
            v-bind="attrs"
            v-on="on"
          >
            Donate ♥
          </v-btn>
        </DonateDialog>
      </v-toolbar-items>

      <router-view name="rightSidebarButton" />

      <template
        v-if="showAppBarExtension"
        #extension
      >
        <TheAppBarCrumbs />

        <v-spacer />
        <router-view
          style="max-width: 400px;"
          name="searchBar"
        />

        <router-view name="appBarView" />
      </template>
    </v-app-bar>

    <v-main
      class="main-content"
      app
    >
      <v-container
        align="start"
        class="pa-0"
        fluid
      >
        <v-img
          :src="GET_BACKGROUND"
          :height="bgHeight"
          @load="backgroundLoad"
          @error="backgroundError"
        >
          <v-sheet
            :color="sheetColor"
            class="overflow-y-auto pa-3"
            :height="bgHeight"
          >
            <v-container
              v-if="!GET_CONFIG"
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
                    size="60"
                    class="amber--text"
                  />
                </v-col>
              </v-row>
            </v-container>

            <router-view v-else />

            <v-snackbar
              :value="GET_SNACKBAR_OPEN"
              :color="GET_SNACKBAR_MESSAGE.color"
              bottom
              timeout="4000"
              content-class="text-center"
              @input="SET_SNACKBAR_OPEN"
            >
              {{ GET_SNACKBAR_MESSAGE.text }}
            </v-snackbar>

            <TheUpnextDialog v-if="GET_UP_NEXT_POST_PLAY_DATA" />
          </v-sheet>
        </v-img>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import './assets/css/style.css';

import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import redirection from '@/mixins/redirection';
import clipboard from '@/mixins/clipboard';
import linkWithRoom from '@/mixins/linkwithroom';
import { slPlayerClientId } from '@/player/constants';

export default {
  components: {
    TheSidebarLeft: () => import('@/components/TheSidebarLeft.vue'),
    TheUpnextDialog: () => import('@/components/TheUpnextDialog.vue'),
    TheNowPlayingChip: () => import('@/components/TheNowPlayingChip.vue'),
    DonateDialog: () => import('@/components/DonateDialog.vue'),
    TheAppBarCrumbs: () => import('@/components/TheAppBarCrumbs.vue'),
  },

  mixins: [
    redirection,
    clipboard,
    linkWithRoom,
  ],

  data: () => ({
    numBackgroundErrors: 0,
  }),

  computed: {
    ...mapGetters([
      'GET_UP_NEXT_POST_PLAY_DATA',
      'GET_CONFIG',
      'GET_ACTIVE_METADATA',
      'GET_SNACKBAR_MESSAGE',
      'GET_SNACKBAR_OPEN',
      'GET_BACKGROUND',
      'GET_NAVIGATE_TO_PLAYER',
      'GET_NAVIGATE_HOME',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_AUTH_TOKEN',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_SERVER_ID',
      'GET_PLEX_CLIENT_TIMELINE',
      'GET_ACTIVE_MEDIA_METADATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    ...mapGetters('synclounge', [
      'IS_IN_ROOM',
      'GET_ROOM',
      'GET_SERVER',
    ]),

    ...mapState([
      'repositoryUrl',
      'discordUrl',
    ]),

    links() {
      return [
        {
          title: 'Github',
          href: this.repositoryUrl,
          target: '_blank',
        },
        {
          title: 'Discord',
          target: '_blank',
          href: this.discordUrl,
        },
      ];
    },

    showNowPlaying() {
      return this.GET_ACTIVE_SERVER_ID && this.GET_CHOSEN_CLIENT_ID !== slPlayerClientId;
    },

    showAppBarExtension() {
      return this.$route.meta.showAppBarExtension;
    },

    smallLogoMedia() {
      return `(max-width: ${this.$vuetify.breakpoint.thresholds.xs}px)`;
    },

    sheetColor() {
      return this.GET_BACKGROUND
        ? 'rgba(0,0,0,0.7)'
        : 'transparent';
    },

    bgHeight() {
      return this.$vuetify.breakpoint.height - this.$vuetify.application.top;
    },

    inviteUrl() {
      if (this.GET_ROOM) {
        if (this.GET_CONFIG?.autojoin) {
          // If autojoin, just link to main site
          return window.location.origin;
        }

        const invitePart = this.$router.resolve({
          name: 'RoomJoin',
          params: {
            room: this.GET_ROOM,
            ...(this.GET_SERVER && { server: this.GET_SERVER }),
          },
        }).href;

        const currentUrl = new URL(window.location.pathname, window.location.origin);
        return new URL(invitePart, currentUrl).toString();
      }
      return '';
    },
  },

  watch: {
    GET_ACTIVE_MEDIA_METADATA(metadata) {
      // This handles regular plex clients (nonslplayer) playback changes
      if (this.IS_IN_ROOM && this.GET_CHOSEN_CLIENT_ID !== slPlayerClientId) {
        if (metadata) {
          this.redirectToMediaPage();
        } else {
          this.$router.push(this.linkWithRoom({ name: 'PlexHome' }));
        }
      }
    },

    GET_NAVIGATE_TO_PLAYER(navigate) {
      if (navigate) {
        this.$router.push(this.linkWithRoom({ name: 'WebPlayer' }));
        this.SET_NAVIGATE_TO_PLAYER(false);
      }
    },

    async GET_NAVIGATE_HOME(navigate) {
      if (navigate) {
        console.debug('NAVIGATE_HOME');
        this.$router.push({ name: 'RoomCreation' });
        this.SET_NAVIGATE_HOME(false);
      }
    },
  },

  async created() {
    if (this.GET_PLEX_AUTH_TOKEN) {
      // Kick off a bunch of requests that we need for later
      this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE();

      try {
        await Promise.all([
          this.FETCH_PLEX_USER(),
          this.FETCH_PLEX_DEVICES(),
        ]);
      } catch (e) {
        // If these fail, then the auth token is probably invalid
        console.error(e);
        await this.DISPLAY_NOTIFICATION({
          text: 'Failed to connect to Plex API. Try logging out and back in.',
          color: 'error',
        });
      }
    }
  },

  mounted() {
    document.addEventListener('fullscreenchange', this.onFullScreenChange);
  },

  beforeDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullScreenChange);
  },

  methods: {
    ...mapActions([
      'DISPLAY_NOTIFICATION',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
      'FETCH_PLEX_USER',
    ]),

    ...mapActions('plexservers', [
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapMutations([
      'SET_SNACKBAR_OPEN',
      'SET_NAVIGATE_TO_PLAYER',
      'SET_NAVIGATE_HOME',
      'SET_LEFT_SIDEBAR_OPEN',
    ]),

    backgroundLoad() {
      this.numBackgroundFailures = 0;
    },

    async backgroundError(e) {
      this.numBackgroundFailures += 1;
      if (this.numBackgroundFailures > 3) {
        console.error(`Failed ${this.numBackgroundFailures} times finding a background. Giving up`);
        return;
      }

      console.warn('Error loading background, trying again', e);
      await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE();
    },

    onFullScreenChange() {
      document.body.classList.toggle('is-fullscreen', document.fullscreenElement);
    },

    toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    },
  },
};
</script>
