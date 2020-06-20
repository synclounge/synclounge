<template>
  <v-list-item
    :style="styleObj"
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

    selected: {
      type: Boolean,
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
