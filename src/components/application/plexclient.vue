<template>
  <v-list-item
    :style="styleObj"
    class="pa-1"
  >
    <v-list-item-avatar>
      <img
        class="clientLogo"
        :class="platformClass"
        :src="url"
      >
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>
        {{ object.name }}
        <v-chip
          v-for="label in object.labels"
          :key="label[0]"
          :color="label[1]"
          small
          label
        >
          {{ label[0] }}
        </v-chip>
      </v-list-item-title>
      <v-list-item-subtitle>{{ object.product }} - last seen {{ lastSeenAgo }}</v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
const moment = require('moment');

export default {
  name: 'Plexclient',
  props: ['object', 'selected', 'startup', 'sidebar'],
  data: () => ({
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
  }),
  computed: {
    tooltipMsg() {
      return `${this.object.name} running ${this.object.product} on ${this.object.device}`;
    },
    connection_success() {
      return this.object.connectedstatus === 'connected';
    },
    connection_wait() {
      return this.object.connectedstatus === 'waiting';
    },
    connection_failed() {
      return this.object.connectedstatus === 'failed';
    },
    connection_fresh() {
      return this.object.connectedstatus === 'fresh';
    },
    isTrunc() {
      if (this.sidebar) {
        return true;
      }
      return false;
    },
    lastSeenAgo() {
      const now = moment(new Date().getTime());
      const end = moment.unix(parseInt(this.object.lastSeenAt));
      const difference = moment.duration(now.diff(end));
      return `${difference.humanize()} ago`;
    },
    platform() {
      return (
        this.platformMap[this.object.platform.toLowerCase()]
        || this.platformMap[this.object.product.toLowerCase()]
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
    styleObj() {
      if (this.selected) {
        return {
          'font-weight': '700',
          background: 'rgba(0,0,0,0.3)',
        };
      }
      return {
        opacity: '0.7',
      };
    },
  },
  methods: {},
};
</script>
