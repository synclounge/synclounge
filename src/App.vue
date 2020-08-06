<template>
  <v-app>
    <leftsidebar />
    <rightsidebar v-if="IS_IN_ROOM" />

    <v-app-bar
      app
      scroll-off-screen
      :scroll-threshold="1"
      style="z-index: 5"
    >
      <v-app-bar-nav-icon @click="SET_LEFT_SIDEBAR_OPEN" />

      <picture>
        <source
          srcset="@/assets/images/logos/logo-small-light.png"
          :media="smallLogoMedia"
        >
        <img
          height="42"
          src="@/assets/images/logos/logo-long-light.png"
          style="vertical-align: middle"
        >
      </picture>

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
        style="height: 100%"
        fluid
      >
        <v-container
          v-if="!GET_CONFIG
            || !IS_DONE_FETCHING_DEVICES && $route.matched.some((record) => record.meta.protected)"
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
          <div style="text-align:center; width:100%">
            {{ GET_SNACKBAR_MESSAGE }}
          </div>
        </v-snackbar>

        <upnext v-if="GET_UP_NEXT_POST_PLAY_DATA" />
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
import redirection from '@/mixins/redirection';

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

  data() {
    return {
      appIsFullscreen: false,
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
      'GET_CONFIG',
      'GET_ACTIVE_METADATA',
      'GET_SNACKBAR_MESSAGE',
      'GET_SNACKBAR_OPEN',
      'GET_BACKGROUND',
      'GET_NAVIGATE_TO_PLAYER',
      'GET_CONFIGURATION_PROMISE',
    ]),

    ...mapGetters('plex', [
      'IS_AUTHENTICATED',
      'IS_DONE_FETCHING_DEVICES',
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
      // TODO: investigate passwords and invites. Is there really a point of a password if the invite link contains it?
      // One alternative is to prompt for a password always instead, but maybe we don't need passwords at all
      if (this.GET_ROOM) {
        if (this.GET_CONFIG.autojoin) {
          // If autojoin, just link to main site
          return window.location.origin;
        }

        const invitePart = this.$router.resolve({
          name: 'join',
          params: {
            ...(this.GET_SERVER.length > 0 && { server: this.GET_SERVER }),
            room: this.GET_ROOM,
            password: this.GET_PASSWORD,
          },
        }).href;

        return new URL(invitePart, window.location).toString();
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
      if (this.IS_IN_ROOM && this.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10') {
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
  },

  async created() {
    await this.GET_CONFIGURATION_PROMISE;
    if (this.IS_AUTHENTICATED) {
      // Kick off a bunch of requests that we need for later
      try {
        await this.FETCH_PLEX_USER();
        await this.FETCH_PLEX_DEVICES_IF_NEEDED();
      } catch (e) {
        // If these fail, then the auth token is probably invalid
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
    fscreen.addEventListener('fullscreenchange', () => {
      const isFullscreen = fscreen.fullscreenElement !== null;
      this.appIsFullscreen = isFullscreen;
      document.body.classList.toggle('is-fullscreen', isFullscreen);
    });
  },

  methods: {
    ...mapActions([
      'SET_LEFT_SIDEBAR_OPEN',
      'SET_RIGHT_SIDEBAR_OPEN',
      'TOGGLE_RIGHT_SIDEBAR_OPEN',
      'DISPLAY_NOTIFICATION',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES_IF_NEEDED',
      'FETCH_PLEX_USER',
    ]),

    ...mapMutations([
      'SET_SNACKBAR_OPEN',
      'SET_NAVIGATE_TO_PLAYER',
    ]),

    ...mapMutations('plex', [
      'SET_PLEX_AUTH_TOKEN',
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

<style scoped>
.main-content {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>
