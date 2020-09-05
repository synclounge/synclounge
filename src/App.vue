<template>
  <v-app>
    <leftsidebar />
    <rightsidebar v-if="IS_IN_ROOM" />

    <v-app-bar
      app
      scroll-off-screen
      :scroll-threshold="1"
      style="z-index: 5;"
    >
      <v-app-bar-nav-icon @click="SET_LEFT_SIDEBAR_OPEN" />

      <router-link
        :to="{ name: 'CreateRoom'}"
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

      <nowplayingchip
        v-if="showNowPlaying"
        class="pl-4"
      />

      <v-spacer />

      <v-toolbar-items>
        <v-btn
          v-if="inviteUrl"
          v-clipboard="() => inviteUrl"
          v-clipboard:success="onInviteCopied"
          color="primary"
          dark
          raised
        >
          Invite
        </v-btn>

        <v-btn
          dark
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

        <donate v-slot="{ on, attrs }">
          <v-btn
            small
            tag="a"
            class="hidden-sm-and-down"
            text
            v-bind="attrs"
            v-on="on"
          >
            Donate ♥
          </v-btn>
        </donate>

        <v-icon
          v-if="IS_IN_ROOM"
          class="clickable order-last"
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
      class="main-content"
      app
    >
      <v-container
        align="start"
        :style="containerStyle"
        style="height: 100%;"
        fluid
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
          color="green darken-2"
          bottom
          timeout="4000"
          @input="SET_SNACKBAR_OPEN"
        >
          <div style="text-align: center; width: 100%;">
            {{ GET_SNACKBAR_MESSAGE }}
          </div>
        </v-snackbar>

        <upnext v-if="GET_UP_NEXT_POST_PLAY_DATA" />
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
import { slPlayerClientId } from '@/player/constants';

export default {
  components: {
    rightsidebar: () => import('@/components/sidebars/rightsidebar.vue'),
    upnext: () => import('@/components/upnext.vue'),
    nowplayingchip: () => import('@/components/nowplayingchip.vue'),
    leftsidebar: () => import('@/components/sidebars/leftsidebar.vue'),
    donate: () => import('@/components/donate.vue'),
    crumbs: () => import('@/components/crumbs.vue'),
  },

  mixins: [
    redirection,
  ],

  computed: {
    ...mapGetters([
      'GET_UP_NEXT_POST_PLAY_DATA',
      'GET_CONFIG',
      'GET_ACTIVE_METADATA',
      'GET_SNACKBAR_MESSAGE',
      'GET_SNACKBAR_OPEN',
      'GET_BACKGROUND',
      'GET_NAVIGATE_TO_PLAYER',
      'GET_REPOSITORY_URL',
      'GET_DISCORD_URL',
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
      'GET_PASSWORD',
    ]),

    ...mapState(['isRightSidebarOpen']),

    links() {
      return [
        {
          title: 'Github',
          href: this.GET_REPOSITORY_URL,
          target: '_blank',
        },
        {
          title: 'Discord',
          target: '_blank',
          href: this.GET_DISCORD_URL,
        },
      ];
    },

    showNowPlaying() {
      return this.GET_ACTIVE_SERVER_ID && this.$route.name === 'browse';
    },

    showCrumbs() {
      // TODO: rewrite this logic but I'm lazy now
      return !(this.$route.path.indexOf('browse') === -1
        && this.$route.path.indexOf('nowplaying') === -1);
    },

    smallLogoMedia() {
      return `(max-width: ${this.$vuetify.breakpoint.thresholds.xs}px)`;
    },

    mainStyle() {
      return this.GET_BACKGROUND
        ? { backgroundImage: `url(${this.GET_BACKGROUND})` }
        : {};
    },

    containerStyle() {
      return this.GET_BACKGROUND
        ? { background: 'rgba(0,0,0,0.7)' }
        : {};
    },

    inviteUrl() {
      if (this.GET_ROOM) {
        if (this.GET_CONFIG.autojoin) {
          // If autojoin, just link to main site
          return window.location.origin;
        }

        const invitePart = this.$router.resolve({
          name: 'join',
          params: {
            room: this.GET_ROOM,
            ...(this.GET_SERVER.length > 0 && { server: this.GET_SERVER }),
          },
        }).href;

        const currentUrl = new URL(window.location.pathname, window.location.origin);
        return new URL(invitePart, currentUrl).toString();
      }
      return '';
    },
  },

  watch: {
    IS_IN_ROOM(isInRoom) {
      if (isInRoom) {
        this.SET_RIGHT_SIDEBAR_OPEN(true);
      }
    },

    GET_ACTIVE_MEDIA_METADATA(metadata) {
      // This handles regular plex clients (nonslplayer) playback changes
      if (this.IS_IN_ROOM && this.GET_CHOSEN_CLIENT_ID !== slPlayerClientId) {
        if (metadata) {
          this.redirectToMediaPage();
        } else if (this.$route.fullPath.indexOf('/nowplaying') > -1) {
          this.$router.push({ name: 'browse' });
        }
      }
    },

    GET_NAVIGATE_TO_PLAYER(navigate) {
      if (navigate) {
        this.$router.push({ name: 'player' });
        this.SET_NAVIGATE_TO_PLAYER(false);
      }
    },

    async GET_NAVIGATE_HOME(navigate) {
      if (navigate) {
        console.log('NAVIGATE_HOME');
        this.$router.push('/');
        this.SET_NAVIGATE_HOME(false);
      }
    },
  },

  async created() {
    if (this.GET_PLEX_AUTH_TOKEN) {
      // Kick off a bunch of requests that we need for later
      this.setRandomBackground();

      try {
        await Promise.all([
          this.FETCH_PLEX_USER(),
          this.FETCH_PLEX_DEVICES(),
        ]);
      } catch (e) {
        // If these fail, then the auth token is probably invalid
        console.error(e);
        this.SET_PLEX_AUTH_TOKEN(null);
        this.$router.push({
          name: 'Signin',
          query: {
            redirect: this.$route.fullPathh,
          },
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
      'SET_LEFT_SIDEBAR_OPEN',
      'SET_RIGHT_SIDEBAR_OPEN',
      'TOGGLE_RIGHT_SIDEBAR_OPEN',
      'DISPLAY_NOTIFICATION',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
      'FETCH_PLEX_USER',
    ]),

    ...mapActions('plexservers', [
      'FETCH_RANDOM_IMAGE_URL',
    ]),

    ...mapMutations([
      'SET_SNACKBAR_OPEN',
      'SET_NAVIGATE_TO_PLAYER',
      'SET_BACKGROUND',
      'SET_NAVIGATE_HOME',
    ]),

    ...mapMutations('plex', [
      'SET_PLEX_AUTH_TOKEN',
    ]),

    async setRandomBackground() {
      this.SET_BACKGROUND(await this.FETCH_RANDOM_IMAGE_URL());
    },

    onInviteCopied() {
      return this.DISPLAY_NOTIFICATION('Copied to clipboard');
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

<style scoped>
.main-content {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>
