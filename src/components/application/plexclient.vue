<template>
  <v-list-tile avatar :style="styleObj">
    <v-list-tile-avatar>
      <img :src="url">
    </v-list-tile-avatar>
    <v-list-tile-content>
      <v-list-tile-title>{{ object.name }}<v-chip v-for="label in object.labels" :key="label[0]" :color="label[1]" small label>{{ label[0] }}</v-chip></v-list-tile-title>
      <v-list-tile-sub-title>{{ object.product }} - last seen {{ lastSeenAgo }}</v-list-tile-sub-title>
    </v-list-tile-content>
  </v-list-tile>
</template>

<script>
var moment = require('moment')

export default {
  props: ['object', 'selected', 'startup', 'sidebar'],
  name: 'plexclient',
  methods: {},
  computed: {
    tooltipMsg: function () {
      return (this.object.name + ' running ' + this.object.product + ' on ' + this.object.device)
    },
    connection_success: function () {
      if (this.object.connectedstatus === 'connected') {
        return true
      }
    },
    connection_wait: function () {
      if (this.object.connectedstatus === 'waiting') {
        return true
      }
    },
    connection_failed: function () {
      if (this.object.connectedstatus === 'failed') {
        return true
      }
    },
    connection_fresh: function () {
      if (this.object.connectedstatus === 'fresh') {
        return true
      }
    },
    isTrunc: function () {
      if (this.sidebar) {
        return true
      }
      return false
    },
    lastSeenAgo: function () {
      let now = moment(new Date().getTime())
      let end = moment.unix(parseInt(this.object.lastSeenAt))
      let difference = moment.duration(now.diff(end))
      return difference.humanize() + ' ago'
    },
    platform: function () {
      return this.platformMap[this.object.platform.toLowerCase()] || this.platformMap[this.object.product.toLowerCase()]
    },
    url: function () {
      if (!this.platform) {
        return 'platforms/plex.svg'
      }
      if (this.object.platform !== 'SyncLounge') {
        return 'platforms/' + this.platform + '.svg'
      }
      return 'platforms/' + this.platform + '.svg'
    },
    styleObj: function () {
      if (this.selected) {
        return {
          'font-weight': '700'
        }
      } else {
        return {
          opacity: '0.7'
        }
      }
    }
  },
  data: () => {
    return {
      platformMap: {
        'android': 'android',
        'apple tv': 'atv',
        'chrome': 'chrome',
        'chromecast': 'chromecast',
        'dlna': 'dlna',
        'firefox': 'firefox',
        'internet explorer': 'ie',
        'ios': 'ios',
        'ipad': 'ios',
        'iphone': 'ios',
        'kodi': 'kodi',
        'linux': 'linux',
        'nexus': 'android',
        'macos': 'macos',
        'microsoft edge': 'msedge',
        'opera': 'opera',
        'osx': 'macos',
        'playstation': 'playstation',
        'plex home theater': 'plex',
        'plex media player': 'plex',
        'plexamp': 'plexamp',
        'plextogether': 'synclounge',
        'roku': 'roku',
        'safari': 'safari',
        'samsung': 'samsung',
        'synclounge': 'synclounge',
        'tivo': 'tivo',
        'tizen': 'samsung',
        'tvos': 'atv',
        'vizio': 'opera',
        'wiiu': 'wiiu',
        'windows': 'windows',
        'windows phone': 'wp',
        'xbmc': 'xbmc',
        'xbox': 'xbox'
      }
    }
  }
}
</script>
