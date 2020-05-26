<template>
  <v-navigation-drawer
    app
    temporary
    :value="isLeftSidebarOpen"
    @input="SET_LEFT_SIDEBAR_OPEN"
    disable-route-watcher
  >
    <v-list-item v-if="plex && plex.user">
      <v-list-item-avatar>
        <img class="pa-1" :src="plex.user.thumb" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title style="font-weight: bold">{{ plex.user.username }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider></v-divider>

    <v-list dense nav>
      <v-subheader>Preferences</v-subheader>
      <v-list-item @click.stop="ptsettingstoggle = !ptsettingstoggle">
        <v-list-item-icon>
          <v-icon color="white">settings</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>SyncLounge Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        v-if="plex && plex.gotDevices"
        @click.stop="plexsettingstoggle = !plexsettingstoggle"
      >
        <v-list-item-icon>
          <v-icon color="white">settings</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Plex Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader v-if="plex && plex.gotDevices">Account</v-subheader>
      <v-list-item :router="true" to="/signout">
        <v-list-item-icon>
          <v-icon color="white">cancel</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Sign out</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>About</v-subheader>
      <v-list-item href="https://synclounge.tv/" target="_blank">
        <v-list-item-icon>
          <v-icon color="white">info</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>SyncLounge v{{appVersion}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item href="https://discord.gg/fKQB3yt" target="_blank">
        <v-list-item-icon>
          <v-icon color="white">chat</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Discord</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item href="https://github.com/samcm/synclounge" target="_blank">
        <v-list-item-icon>
          <v-icon color="white">code</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>GitHub</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click.stop="donateDialog = true">
        <v-list-item-icon>
          <v-icon color="white">favorite</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Donate</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <div class="text-center pa-2" style="opacity: 0.7; font-size: 12px">
        <div>Build #{{ hash }}</div>
        <div>Last updated {{ updatedAt }}</div>
      </div>
    </template>

    <v-dialog v-model="ptsettingstoggle" width="350">
      <v-card style="background-color: #151924" class="pa-3">
        <div class="text-center">
          <h2>SyncLounge Settings</h2>
        </div>
        <v-divider class="mt-2 mb-2"></v-divider>
        <ptsettings class="darken-4 pa-1"></ptsettings>
      </v-card>
    </v-dialog>
    <v-dialog v-model="plexsettingstoggle" width="350">
      <v-card style="background-color: #151924" class="pa-3">
        <div class="text-center">
          <h2>Plex Settings</h2>
        </div>
        <v-divider class="mt-2 mb-2"></v-divider>
        <plexsettings class="darken-4 pa-1" v-if="validPlex && plex.gotDevices"></plexsettings>
      </v-card>
    </v-dialog>
    <v-dialog v-model="donateDialog" max-width="650px">
      <donate :donateDialog="donateDialog" :onClose="() => this.donateDialog = false"></donate>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import ptsettings from './components/application/settings.vue';
import plexsettings from './components/application/plexsettings.vue';
import donate from './donate.vue';

const moment = require('moment');

export default {
  components: {
    ptsettings,
    plexsettings,
    donate,
  },
  data() {
    return {
      ptsettingstoggle: false,
      plexsettingstoggle: false,
      donateDialog: false,
    };
  },
  computed: {
    ...mapState(['isLeftSidebarOpen']),
    plex() {
      return this.$store.getters.getPlex;
    },
    hash() {
      return process.env.gitHash;
    },
    date() {
      return process.env.gitDate;
    },
    updatedAt() {
      return moment(this.date).fromNow();
    },
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    validPlex() {
      if (!this.$store.state.plex) {
        return false;
      }
      return true;
    },
    appVersion() {
      return this.$store.state.appVersion;
    },
    validDevices() {
      if (!this.plex) {
        return false;
      }
      return this.plex.gotDevices;
    },
    showBrowser() {
      return this.chosenClient && !this.chosenClient.clientPlayingMetadata && this.ptRoom;
    },
    isPTPlayer() {
      return this.chosenClient && this.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10';
    },
    showMetadata() {
      return (
        !this.isPTPlayer &&
        !this.showBrowser &&
        this.chosenClient &&
        this.chosenClient.clientPlayingMetadata
      );
    },
    darkMode() {
      return this.$store.getters.getSettingDARKMODE;
    },
    ptConnected() {
      return this.$store.getters.getConnected;
    },
    ptServer() {
      return this.$store.getters.getServer;
    },
    ptRoom() {
      return this.$store.getters.getRoom;
    },
    ptPassword() {
      return this.$store.getters.getPassword;
    },
    ptUsers() {
      return this.$store.getters.getUsers;
    },
    userCount() {
      const count = this.$store.getters.getUsers.length;
      if (count === 1) {
        return `${count} user`;
      }
      return `${count} users`;
    },
    chatBoxMessage() {
      return `Message ${this.$store.getters.getRoom}`;
    },
    playercount() {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return `(${this.$store.state.plex.clients.length})`;
      }
      return '';
    },
    servercount() {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return `(${this.$store.state.plex.servers.length})`;
      }
      return '';
    },
    showChatValue() {
      if (this.$store.getters.getShownChat) {
        return 'block';
      }
      return 'none';
    },
    messages() {
      return this.$store.getters.getMessages;
    },
  },
  methods: {
    ...mapActions(['SET_LEFT_SIDEBAR_OPEN']),
    isHost(user) {
      return user.role === 'host';
    },
    percent(user) {
      let perc = (parseInt(user.time) / parseInt(user.maxTime)) * 100;
      if (isNaN(perc)) {
        perc = 0;
      }
      return perc;
    },
    getCurrent(user) {
      if (isNaN(user.time)) {
        return this.getTimeFromMs(0);
      }
      return this.getTimeFromMs(user.time);
    },
    getMax(user) {
      if (isNaN(user.maxTime)) {
        return this.getTimeFromMs(0);
      }
      return this.getTimeFromMs(user.maxTime);
    },
    getTitle(user) {
      if (user.title && user.title.length > 0) {
        return user.title;
      }
      return 'Nothing';
    },
    sendMessage() {
      this.$store.dispatch('sendNewMessage', this.messageToBeSent);
      this.messageToBeSent = '';
    },
    playerState(user) {
      if (user.playerState) {
        if (user.playerState === 'stopped') {
          return 'pause';
        }
        if (user.playerState === 'paused') {
          return 'pause';
        }
        if (user.playerState === 'playing') {
          return 'play_arrow';
        }
      }
      return false;
    },
    getTimeFromMs(ms) {
      const hours = ms / (1000 * 60 * 60);
      const absoluteHours = Math.floor(hours);
      const h = absoluteHours > 9 ? absoluteHours : `0${absoluteHours}`;
      const minutes = (hours - absoluteHours) * 60;
      const absoluteMinutes = Math.floor(minutes);
      const m = absoluteMinutes > 9 ? absoluteMinutes : `0${absoluteMinutes}`;
      const seconds = (minutes - absoluteMinutes) * 60;
      const absoluteSeconds = Math.floor(seconds);
      const s = absoluteSeconds > 9 ? absoluteSeconds : `0${absoluteSeconds}`;
      return `${h}:${m}:${s}`;
    },
  },
};
</script>

<style scoped>
.v-list__tile__action {
  justify-content: center;
}
</style>