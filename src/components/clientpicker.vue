<template>
  <v-list
    dense
  >
    <v-subheader>
      Plex Players
      <v-btn
        icon
        x-small
        @click="PLEX_GET_DEVICES"
      >
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-subheader>
    <v-list-item-group
      mandatory
      :value="GET_CHOSEN_CLIENT"
      @change="CHOOSE_CLIENT"
    >
      <plexclient
        v-for="client in GET_RECENT_PLEX_CLIENTS"
        :key="client.clientIdentifier"
        :object="client"
        :value="client"
      />
    </v-list-item-group>
  </v-list>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import plexclient from './application/plexclient.vue';

export default {
  name: 'ClientPicker',
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
    ]),
  },

  mounted() {
    this.PLEX_GET_DEVICES();
  },

  methods: {
    ...mapActions([
      'PLEX_GET_DEVICES',
      'CHOOSE_CLIENT',
    ]),
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
  },
};
</script>
