<template>
  <v-list-item
    ref="test"
    :style="styleObj"
    v-bind="$attrs"
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

      <v-list-item-subtitle>
        {{ object.product }} - last seen {{ lastSeenAgo }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';

export default {
  name: 'Plexclient',
  props: {
    object: {
      type: Object,
      default: () => {},
    },

    selected: {
      type: Boolean,
    },

    sidebar: {
      type: Boolean,
    },
  },

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
    lastSeenAgo() {
      return `${formatDistanceToNow(parseISO(this.object.lastSeenAt))} ago`;
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
};
</script>
