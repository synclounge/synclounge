<template>
  <v-row justify="center">
    <v-col
      lg="8"
      style="background: rgba(0,0,0,0.1); border-radius: 10px"
      class="pa-4"
    >
      <v-row justify="center">
        <v-col
          md="8"
          lg="4"
        >
          <img
            style="width:100%"
            :src="getLogos.light.long "
          >
        </v-col>
      </v-row>
      <v-stepper
        v-model="e1"
        style="background: rgba(0,0,0,0.3); color: white !important; border-radius: 20px"
        class="ma-4"
      >
        <v-stepper-header dark>
          <v-stepper-step
            step="1"
            dark
            :complete="true"
          >
            Select a client
          </v-stepper-step>
          <v-divider />
          <v-stepper-step
            step="2"
            dark
            :complete="false"
          >
            Join a room
          </v-stepper-step>
          <v-divider />
          <v-stepper-step step="3">
            Sync
          </v-stepper-step>
        </v-stepper-header>
      </v-stepper>
      <div v-if="!GET_CHOSEN_CLIENT">
        <v-row class="ml-4">
          <v-col class="pb-0">
            <h2>Choose your Plex player</h2>
          </v-col>
        </v-row>
        <v-row class="ml-4">
          <v-col
            class="pt-0"
          >
            Choose a client from the list below. Once you've found the client you would like to
            use, click the connect button. SyncLounge will test to see if it can connect with the
            client and will let you know if it cannot.
          </v-col>
        </v-row>
        <div
          v-if="!IS_DONE_FETCHING_DEVICES"
          class="text-center pa-4"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>
        <v-row
          v-else
          justify="center"
          class="ml-4 mr-4"
        >
          <v-col
            v-if="!doReverse"
            md="6"
            lg="6"
          >
            <v-subheader>
              Plex Players
              <v-icon
                class="pl-2"
                small
                @click="FETCH_PLEX_DEVICES"
              >
                refresh
              </v-icon>
            </v-subheader>
            <v-list
              dense
              style="background: none"
            >
              <plexclient
                v-for="i in GET_RECENT_PLEX_CLIENTS"
                :key="i.clientIdentifier"
                :selected="isClientSelected(i)"
                :object="i"
                style="cursor: pointer"
                @click.native="
                  previewClient(i);
                  gotResponse = true;
                "
              />
            </v-list>
          </v-col>
          <v-col
            md="6"
            lg="6"
          >
            <div
              v-if="testClient"
              class="pa-2"
            >
              <v-subheader>Selected Player</v-subheader>
              <v-row>
                <v-col
                  md="3"
                  class="text-center"
                  style="position: relative"
                >
                  <img
                    :src="url"
                    style="height: 100px; width: auto; vertical-align: middle"
                  >
                </v-col>
                <v-col md="9">
                  <div class="selected-player-details pl-1">
                    <h3>{{ testClient.name }}</h3>
                    <div>
                      <label>Last seen</label>
                      <span style="opacity:0.8">{{ lastSeenAgo(testClient.lastSeenAt) }}</span>
                    </div>
                    <div>
                      <label>Device</label>
                      <span style="opacity:0.8">{{ testClient.device }}</span>
                    </div>
                    <div>
                      <label>Running</label>
                      <span style="opacity:0.8">{{ testClient.product }}</span>
                    </div>
                    <div class="pb-2">
                      <label>Platform</label>
                      <span style="opacity:0.8">{{ testClient.platform }}</span>
                    </div>
                    <div
                      v-if="testClientErrorMsg"
                      class="red--text text--lighten-1"
                    >
                      {{ testClientErrorMsg }}
                    </div>
                  </div>
                </v-col>
              </v-row>
              <v-row class="pt-2">
                <v-col>
                  <div
                    v-if="!gotResponse"
                    class="center spinner-orange"
                  >
                    <div style="width:100%;text-align:center">
                      <v-progress-circular
                        indeterminate
                        :size="50"
                        class="amber--text"
                        style="display:inline-block"
                      />
                    </div>
                  </div>
                  <div v-if="gotResponse">
                    <v-btn
                      block
                      color="primary"
                      @click.native="clientClicked()"
                    >
                      Connect
                    </v-btn>
                  </div>
                  <div
                    v-if="testClient.product.indexOf('Web') > -1"
                    class="warning--text"
                  >
                    Note: Plex Web is currently not supported.
                  </div>
                  <div
                    v-if="testClient.product.indexOf('Plex for Android') > -1"
                    class="warning--text"
                  >
                    Note: Plex for Android applications may not work properly. See "What clients are
                    supported?" in the
                    <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more details.
                  </div>
                  <div
                    v-if="testClient.product.indexOf('Plex for Windows') > -1"
                    class="warning--text"
                  >
                    Note: Plex Desktop applications may not work properly. See "What clients are
                    supported?" in the
                    <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more details.
                  </div>
                  <div
                    v-if="isHttps && testClient.clientIdentifier !== 'PTPLAYER9PLUS10'"
                    class="warning--text"
                  >
                    Note: You may not be able to connect to external Plex Clients while loading the
                    page via HTTPS. Click
                    <a :href="nohttpslink">here</a> to load the page via HTTP. See "My client isn't
                    working!" in the <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more
                    details.
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>
          <v-col
            v-if="doReverse"
            md="6"
            lg="7"
          >
            <v-subheader>Plex Players</v-subheader>
            <v-list
              dense
              style="background: none"
            >
              <plexclient
                v-for="i in GET_RECENT_PLEX_CLIENTS"
                :key="i.clientIdentifier"
                :selected="isClientSelected(i)"
                :object="i"
                style="cursor: pointer"
                @click.native="
                  previewClient(i);
                  gotResponse = true;
                "
              />
            </v-list>
          </v-col>
        </v-row>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';
import { mapActions, mapGetters, mapState } from 'vuex';

import plexclient from './plexclient.vue';

export default {
  name: 'Walkthrough',
  components: {
    plexclient,
  },

  data() {
    return {
      testClient: null,
      testClientErrorMsg: null,
      gotResponse: true,
      e1: '1',
      joinRoomModal: false,
      platformMap: {
        android: 'android',
        'apple tv': 'atv',
        chrome: 'chrome',
        chromecast: 'chromecast',
        dlna: 'dlna',
        firefox: 'firefox',
        'internet explorer': 'ie',
        ios: 'ios',
        ipad: 'ios',
        iphone: 'ios',
        kodi: 'kodi',
        linux: 'linux',
        nexus: 'android',
        macos: 'macos',
        'microsoft edge': 'msedge',
        opera: 'opera',
        osx: 'macos',
        playstation: 'playstation',
        'plex home theater': 'plex',
        'plex media player': 'plex',
        plexamp: 'plexamp',
        plextogether: 'synclounge',
        roku: 'roku',
        safari: 'safari',
        samsung: 'samsung',
        synclounge: 'synclounge',
        tivo: 'tivo',
        tizen: 'samsung',
        tvos: 'atv',
        vizio: 'opera',
        wiiu: 'wiiu',
        windows: 'windows',
        'windows phone': 'wp',
        xbmc: 'xbmc',
        xbox: 'xbox',
      },
    };
  },
  computed: {
    ...mapState(['plex']),
    ...mapGetters([
      'GET_CHOSEN_CLIENT',
      'getLogos',
      'GET_RECENT_PLEX_CLIENTS',
      'IS_DONE_FETCHING_DEVICES',
    ]),
    doReverse() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs':
          return true;
        case 'sm':
          return true;
        default:
          return false;
      }
    },
    isHttps() {
      return window.location.protocol === 'https:';
    },
    platform() {
      if (!this.testClient || !this.testClient.platform) {
        return '';
      }
      return (
        this.platformMap[this.testClient.platform.toLowerCase()]
        || this.platformMap[this.testClient.product.toLowerCase()]
      );
    },
    platformClass() {
      return [`platform-${this.platform}`];
    },
    url() {
      if (!this.platform) {
        return 'platforms/plex.svg';
      }
      if (this.platform === 'synclounge') {
        return 'platforms/synclounge.png';
      }
      return `platforms/${this.platform}.svg`;
    },
    clients() {
      return this.plex.clients;
    },

    nohttpslink() {
      if (!this.isHttps) {
        return '';
      }
      let url = `http:${window.location.href.substring(window.location.protocol.length)}`;
      if (this.$store.state.autoJoin) {
        url = `${url}?server=${this.$store.state.autoJoinUrl}&room=${this.$store.state.autoJoinRoom}&autojoin=true&owner=${this.$store.state.autoJoinOwner}`;
        if (this.$store.state.autoJoinPassword) {
          url = `${url}&password=${this.$store.state.autoJoinPassword}`;
        }
        url = url.replace('clientselect', 'join');
      }
      return url;
    },
  },
  watch: {
    GET_CHOSEN_CLIENT(to, from) {
      if (this.GET_CHOSEN_CLIENT && !from) {
        this.$router.push('/joinroom');
      }
    },
  },

  mounted() {
    this.FETCH_PLEX_DEVICES();
  },

  methods: {
    ...mapActions([
      'CHOOSE_CLIENT',
      'FETCH_PLEX_DEVICES',
    ]),
    previewClient(client) {
      this.testClient = client;
      this.testClientErrorMsg = null;
    },
    async clientClicked() {
      const client = this.testClient;
      this.gotResponse = false;
      this.testClientErrorMsg = null;
      this.$store
        .dispatch('PLEX_CLIENT_FINDCONNECTION', client)
        .then(() => {
          this.CHOOSE_CLIENT(client);
          this.gotResponse = true;
        })
        .catch(() => {
          if (client.clientIdentifier !== this.testClient.clientIdentifier) {
            return;
          }
          this.gotResponse = true;
          this.testClientErrorMsg = 'Unable to connect to client';
        });
    },
    isClientSelected(client) {
      if (client === this.testClient) {
        return true;
      }
      return false;
    },
    lastSeenAgo(clientTime) {
      return `${formatDistanceToNow(parseISO(clientTime))} ago`;
    },
    refreshPlexDevices() {
      this.CHOOSE_CLIENT(null);
      this.$store.commit('REFRESH_PLEXDEVICES');
    },
  },
};
</script>
<style scoped>
.selected-player-details label + span {
  margin-left: 5px;
}
</style>
