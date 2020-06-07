<template>
  <v-app
    dark
    style="height:100%"
  >
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
          v-if="getShortLink != null"
          v-clipboard="getShortLink"
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

    <v-content
      :style="mainStyle"
      app
    >
      <v-container
        class="ma-0 pa-0"
        align-start
        :style="containerStyle"
        style="height: 100%; z-index: 250"
        fluid
      >
        <v-alert
          :dismissible="true"
          type="error"
          class="mt-0"
        >
          {{ configError }}
        </v-alert>


        <v-container
          v-if="(loading || (getPlex && !getPlex.gotDevices)) && $route.protected"
          fill-height
        >
          <v-layout
            justify-center
            align-center
            wrap
            row
            class="pt-4 text-center"
          >
            <v-flex
              xs8
              md4
            >
              <v-progress-circular
                indeterminate
                :size="60"
                class="amber--text"
              />
            </v-flex>
          </v-layout>
        </v-container>

        <div
          v-else
          :style="paddingStyle"
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
        </div>
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
    </v-content>
  </v-app>
</template>

<script>
// Custom css
import './assets/css/style.css';

import { mapActions, mapGetters, mapState } from 'vuex';
import fscreen from 'fscreen';

export default {
  components: {
    rightsidebar: () => import('./sidebar.vue'),
    upnext: () => import('./upnext.vue'),
    nowplayingchip: () => import('./nowplayingchip.vue'),
    leftsidebar: () => import('./leftsidebar.vue'),
    donate: () => import('./donate.vue'),
  },

  data() {
    return {
      fixed: false,
      initialized: false,
      donateDialog: false,

      loading: true,
      configError: null,

      snackbar: false,
      snackbarMsg: false,
      configFetchPromise: null,

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
      'getPlex',
      'getItemCache',
      'getLibraryCache',
      'getChosenClient',
      'getConnected',
      'getRoom',
      'getServer',
      'getShortLink',
      'GET_SYNCLOUNGE_SERVERS',
      'GET_UP_NEXT_POST_PLAY_DATA',
      'getLogos',
    ]),
    ...mapGetters('config', ['GET_CONFIG']),
    ...mapState(['isRightSidebarOpen']),

    extAvailable() {
      return this.$store.getters.getExtAvailable;
    },

    crumbs() {
      if (
        this.$route.path.indexOf('browse') === -1
        && this.$route.path.indexOf('nowplaying') === -1
      ) {
        return [];
      }
      const getTitle = (id) => {
        try {
          return this.getItemCache[this.$route.params.machineIdentifier][id].title;
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
          text: this.getPlex.servers[this.$route.params.machineIdentifier].name,
          to: `/browse/${this.$route.params.machineIdentifier}`,
        }),
        sectionId: () => ({
          text: getLibrary(this.$route.params.sectionId),
          to: `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}`,
        }),
        parentKey: () => {
          let to;
          if (this.$route.params.grandparentKey) {
            to = `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.grandparentKey}/${this.$route.params.parentKey}`;
          } else {
            to = `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.parentKey}`;
          }
          return {
            text: getTitle(this.$route.params.parentKey),
            to,
          };
        },
        grandparentKey: () => ({
          text: getTitle(this.$route.params.grandparentKey),
          to: `/browse/${this.$route.params.machineIdentifier}/${this.$route.params.sectionId}/tv/${this.$route.params.grandparentKey}/`,
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
      return (
        this.getChosenClient
        && this.getChosenClient.clientPlayingMetadata
        && this.$route.name === 'browse'
      );
    },

    showRightDrawerButton() {
      return this.getConnected && this.getChosenClient && this.getRoom;
    },

    showLinkShortener() {
      return this.getConnected && this.getServer && this.getRoom && this.getShortLink;
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

    paddingStyle() {
      const arr = [];
      if (this.$route.path.indexOf('/player') === -1) {
        arr.push({
          padding: '16px',
        });
      }
      return arr;
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

  async mounted() {
    try {
      await this.configFetchPromise;
    } catch (e) {
      this.configError = `Failed to fetch config: ${e}`;
    }
    //
    //  Settings
    //
    // Set AutoJoin information in order of importance: query -> config -> settings
    if (this.$route.query.autojoin) {
      this.$store.commit('SET_AUTOJOIN', true);
      this.$store.commit('SET_AUTOJOINROOM', this.$route.query.room);
      this.$store.commit('SET_AUTOJOINURL', this.$route.query.server);
      this.$store.commit('SET_VALUE', ['autoJoinOwner', this.$route.query.owner]);
      if (this.$route.query.password) {
        this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.password);
      }
    } else if (this.GET_CONFIG) {
      if (this.GET_CONFIG.autoJoin && this.GET_CONFIG.autoJoin === true) {
        this.$store.commit('SET_AUTOJOIN', true);
        this.$store.commit('SET_AUTOJOINROOM', this.GET_CONFIG.autoJoinRoom);
        this.$store.commit('SET_AUTOJOINURL', this.GET_CONFIG.autoJoinServer);
        this.$store.commit('SET_AUTOJOINPASSWORD', this.GET_CONFIG.autoJoinPassword);
      }
    }

    // Auto-join if a single server is provided and autoJoinServer is not
    if (this.GET_SYNCLOUNGE_SERVERS.length === 1 && !this.$store.autoJoinServer) {
      const server = this.GET_SYNCLOUNGE_SERVERS[0];
      this.$store.commit('SET_AUTOJOIN', true);
      this.$store.commit('SET_AUTOJOINURL', server.url);
      if (!this.$store.autoJoinRoom && server.defaultRoom) {
        this.$store.commit('SET_AUTOJOINROOM', server.defaultRoom);
      }
      if (!this.$store.autoJoinPassword && server.defaultPassword) {
        this.$store.commit('SET_AUTOJOINPASSWORD', server.defaultPassword);
      }
    }
    //
    // End Settings
    //

    if (this.$store.state.autoJoin) {
      this.$store.dispatch('autoJoin', {
        server: this.$store.state.autoJoinUrl,
        password: this.$store.state.autoJoinPassword,
        room: this.$store.state.autoJoinRoom,
      });
    }

    window.EventBus.$on('notification', (msg) => {
      this.snackbarMsg = msg;
      this.snackbar = true;
    });

    window.EventBus.$on('NEW_TIMELINE', (timeline) => {
      this.$store.dispatch('NEW_TIMELINE', timeline);
    });

    window.EventBus.$on('PLAYBACK_CHANGE', (data) => {
      if (this.getChosenClient.clientIdentifier !== 'PTPLAYER9PLUS10' && data[1]) {
        this.$router.push(`/nowplaying/${data[2].machineIdentifier}/${data[1]}`);
      }
      if (
        this.getChosenClient.clientIdentifier !== 'PTPLAYER9PLUS10'
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

    this.loading = false;
  },

  created() {
    this.configFetchPromise = this.fetchConfig();
  },

  methods: {
    ...mapActions('config', ['fetchConfig']),
    ...mapActions(['SET_LEFT_SIDEBAR_OPEN', 'SET_RIGHT_SIDEBAR_OPEN', 'TOGGLE_RIGHT_SIDEBAR_OPEN']),
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
