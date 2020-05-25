<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 lg8 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
      <v-layout row wrap justify-center>
        <v-flex xs12 md8 lg4 xl6>
          <img style="width:100%" :src="logo">
        </v-flex>
      </v-layout>
      <v-stepper style="background: rgba(0,0,0,0.3); color: white !important; border-radius: 20px" v-model="e1" class="ma-4">
        <v-stepper-header dark>
          <v-stepper-step step="1" dark :complete="true">Select a client</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="2" dark :complete="false">Join a room</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="3">Sync</v-stepper-step>
        </v-stepper-header>
      </v-stepper>
      <div v-if="!chosenClient">
        <v-layout row wrap justify-center mb-2>
          <v-flex xs12 class="ml-4">
            <h2>Choose your Plex player</h2>
          </v-flex>
          <v-flex xs12 class="ml-4">
            Choose a client from the list below. Once you've found the client you would like to use, click the connect button. SyncLounge will test to see if it can connect with the client and will let you know if it cannot.
          </v-flex>
        </v-layout>
        <div v-if="plex && !plex.gotDevices" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <v-layout v-else row wrap justify-center class="ml-4 mr-4">
          <v-flex xs10 md6 lg6 v-if="!doReverse">
            <v-subheader>Plex Players {{ playercount }}
              <v-icon @click="PLEX_GET_DEVICES()" class="pl-2" small>refresh</v-icon>
            </v-subheader>
            <v-list dense style="background: none">
              <plexclient v-for="i in recentClients" :key="i.clientIdentifier" @click.native="previewClient(i); gotResponse = true" :selected="isClientSelected(i)" :object="i" style="cursor: pointer"></plexclient>
            </v-list>
          </v-flex>
          <v-flex xs10 md6 lg6>
            <div v-if="testClient" class="pa-2">
              <v-subheader>
                Selected Player
              </v-subheader>
              <v-layout row wrap>
                <v-flex md3 class="text-center" style="position: relative">
                  <img :src="url" style="height: 100px; width: auto; vertical-align: middle" />
                </v-flex>
                <v-flex xs12 md9>
                  <div class="pl-1">
                    <h3>{{ testClient.name }}</h3>
                    <div>
                      <label>Last seen</label><span style="opacity:0.8">  {{ lastSeenAgo(testClient.lastSeenAt) }}</span>
                    </div>
                    <div>
                      <label>Device</label><span style="opacity:0.8">  {{ testClient.device }}</span>
                    </div>
                    <div>
                      <label>Running</label><span style="opacity:0.8">  {{ testClient.product }} </span>
                    </div>
                    <div class="pb-2">
                      <label>Platform</label><span style="opacity:0.8">  {{ testClient.platform }} </span>
                    </div>
                    <div class="red--text text--lighten-1" v-if="testClientErrorMsg">
                      {{ testClientErrorMsg }}
                    </div>
                    </div>
                </v-flex>
              </v-layout>
              <v-layout row wrap class="pt-2">
                <v-flex xs12>
                  <div v-if="!gotResponse" class="center spinner-orange">
                      <div style="width:100%;text-align:center">
                        <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
                      </div>
                    </div>
                    <div v-if="gotResponse">
                      <v-btn block color="primary" v-on:click.native="clientClicked()">Connect</v-btn>
                    </div>
                    <div v-if="testClient.product.indexOf('Web') > -1" class="warning--text">
                      Note: Plex Web is currently not supported.
                    </div>
                    <div v-if="testClient.product.indexOf('Plex for Android') > -1" class="warning--text">
                      Note: Plex for Android applications may not work properly. See "What clients are supported?" in the <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more details.
                    </div>
                    <div v-if="testClient.product.indexOf('Plex for Windows') > -1" class="warning--text">
                      Note: Plex Desktop applications may not work properly. See "What clients are supported?" in the <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more details.
                    </div>
                    <div v-if="isHttps && testClient.clientIdentifier !== 'PTPLAYER9PLUS10'" class="warning--text">
                      Note: You may not be able to connect to external Plex Clients while loading the page via HTTPS. 
                      Click <a :href="nohttpslink">here</a> to load the page via HTTP. 
                      See "My client isn't working!" in the <a href="http://docs.synclounge.tv/faq/">FAQ</a> for more details.
                    </div>
                </v-flex>
              </v-layout>
            </div>
          </v-flex>
          <v-flex xs12 md6 lg7 v-if="doReverse">
            <v-subheader>Plex Players {{ playercount }}</v-subheader>
            <v-list dense style="background: none">
              <plexclient v-for="i in recentClients" :key="i.clientIdentifier" @click.native="previewClient(i); ; gotResponse = true" :selected="isClientSelected(i)" :object="i" style="cursor: pointer"></plexclient>
            </v-list>
          </v-flex>
        </v-layout>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import plexclient from './plexclient';
import joinroom from './joinroom';

import { mapState, mapActions } from 'vuex';

const moment = require('moment');

export default {
  props: ['object'],
  name: 'walkthrough',
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
  components: {
    plexclient,
    joinroom,
  },
  computed: {
    ...mapState(['plex']),
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
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    isHttps() {
      return location.protocol === 'https:';
    },
    platform() {
      if (!this.testClient || !this.testClient.platform) {
        return;
      }
      return (
        this.platformMap[this.testClient.platform.toLowerCase()] ||
        this.platformMap[this.testClient.product.toLowerCase()]
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
    context() {
      return this.$store;
    },
    playercount() {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return `(${Object.keys(this.plex.clients).length})`;
      }
      return '';
    },
    nohttpslink() {
      if (!this.isHttps) {
        return '';
      }
      let url = `http:${window.location.href.substring(window.location.protocol.length)}`;
      if (this.$store.state.autoJoin) {
        url = `${url}?server=${this.$store.state.autoJoinUrl}&room=${
          this.$store.state.autoJoinRoom
        }&autojoin=true&owner=${this.$store.state.autoJoinOwner}`;
        if (this.$store.state.autoJoinPassword) {
          url = `${url}&password=${this.$store.state.autoJoinPassword}`;
        }
        url = url.replace('clientselect', 'join');
      }
      return url;
    },
    logo() {
      return this.logos.light.long;
    },
    recentClients() {
      return this.$store.getters.recentClients;
    },
  },
  watch: {
    chosenClient(to, from) {
      if (this.chosenClient && !from) {
        this.$router.push('/joinroom');
      }
    },
  },
  methods: {
    ...mapActions(['PLEX_GET_DEVICES']),
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
          this.$store.commit('SET_CHOSENCLIENT', client);
          this.gotResponse = true;
        })
        .catch((e) => {
          if (client.clientIdentifier !== this.testClient.clientIdentifier) {
            return;
          }
          this.gotResponse = true;
          this.testClientErrorMsg = 'Unable to connect to client';
        });
    },
    openJoinRoomModal() {
      return this.$parent.$refs.joinroomModal.open();
    },
    isClientSelected(client) {
      if (client === this.testClient) {
        return true;
      }
      return false;
    },
    lastSeenAgo(clientTime) {
      const now = moment(new Date().getTime());
      const end = moment.unix(parseInt(clientTime));
      const difference = moment.duration(now.diff(end));
      return `${difference.humanize()} ago`;
    },
    refreshPlexDevices() {
      this.$store.commit('SET_CHOSENCLIENT', null);
      this.$store.commit('REFRESH_PLEXDEVICES');
    },
  },
};
</script>
