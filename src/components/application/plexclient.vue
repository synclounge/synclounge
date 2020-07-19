<template>
  <v-list-item
    v-bind="$attrs"
  >
    <v-list-item-avatar>
      <v-img
        class="clientLogo"
        :class="platformClass"
        :src="url"
      />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>
        {{ plexClient.name }}
        <v-chip
          v-for="label in plexClient.labels"
          :key="label[0]"
          :color="label[1]"
          small
          label
        >
          {{ label[0] }}
        </v-chip>
      </v-list-item-title>

      <v-list-item-subtitle>
        {{ plexClient.product }} - last seen {{ lastSeenAgo }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDistanceToNow, parseISO } from 'date-fns';
import plexPlatformMap from '@/utils/plexplatformmap';

export default {
  name: 'Plexclient',

  props: {
    clientId: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters('plexclients', [
      'GET_PLEX_CLIENT',
    ]),

    plexClient() {
      return this.GET_PLEX_CLIENT(this.clientId);
    },

    lastSeenAgo() {
      return `${formatDistanceToNow(parseISO(this.plexClient.lastSeenAt))} ago`;
    },

    platform() {
      return (
        plexPlatformMap[this.plexClient.platform.toLowerCase()]
        || plexPlatformMap[this.plexClient.product.toLowerCase()]
      );
    },

    platformClass() {
      return [`platform-${this.platform}`];
    },

    url() {
      if (this.platform) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        return require(`@/assets/images/platforms/${this.platform}.svg`);
      }

      // eslint-disable-next-line global-require
      return require('@/assets/images/platforms/plex.svg');
    },
  },
};
</script>

<style scoped>
.clientLogo {
  padding: 3px;
  background-origin: content-box !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}

.platform-android {
  background-color: #a4ca39;
}

.platform-atv {
  background-color: #858487;
}

.platform-chrome {
  background-color: #ed5e50;
}

.platform-chromecast {
  background-color: #10a4e8;
}

.platform-default {
  background-color: #e5a00d;
}

.platform-dlna {
  background-color: #0cb14b;
}

.platform-firefox {
  background-color: #e67817;
}

.platform-gtv {
  background-color: #008bcf;
}

.platform-ie {
  background-color: #00599e;
}

.platform-ios {
  background-color: #858487;
}

.platform-kodi {
  background-color: #31afe1;
}

.platform-linux {
  background-color: #1793d0;
}

.platform-macos {
  background-color: #858487;
}

.platform-msedge {
  background-color: #0078d7;
}

.platform-opera {
  background-color: #ff1b2d;
}

.platform-playstation {
  background-color: #034da2;
}

.platform-plex {
  background-color: #e5a00d;
}

.platform-plexamp {
  background-color: #e5a00d;
}

.platform-roku {
  background-color: #6d3c97;
}

.platform-safari {
  background-color: #00a9ec;
}

.platform-samsung {
  background-color: #034ea2;
}

.platform-synclounge {
  background-color: #3e4f82;
}

.platform-tivo {
  background-color: #00a7e1;
}

.platform-wiiu {
  background-color: #03a9f4;
}

.platform-windows {
  background-color: #2fc0f5;
}

.platform-wp {
  background-color: #68217a;
}

.platform-xbmc {
  background-color: #3b4872;
}

.platform-xbox {
  background-color: #107c10;
}
</style>
