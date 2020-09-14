<template>
  <v-list-item
    two-line
    dense
    hover
    class="nowplaying"
    :to="href"
  >
    <v-list-item-avatar
      class="ma-0"
      tile
      size="52"
    >
      <v-img
        contain
        :src="thumb"
      />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>
        Now Playing
      </v-list-item-title>

      <v-list-item-subtitle>
        {{ getTitle(GET_ACTIVE_MEDIA_METADATA) }} - {{
          getSecondaryTitle(GET_ACTIVE_MEDIA_METADATA) }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import { mapGetters } from 'vuex';

import contentTitle from '@/mixins/contentTitle';
import getContentLink from '@/utils/contentlinks';

export default {
  name: 'TheNowPlayingChip',

  mixins: [
    contentTitle,
  ],

  computed: {
    ...mapGetters('plexclients', [
      'GET_ACTIVE_MEDIA_METADATA',
      'GET_ACTIVE_SERVER_ID',
    ]),

    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
    ]),

    href() {
      return getContentLink(this.GET_ACTIVE_MEDIA_METADATA);
    },

    thumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.GET_ACTIVE_SERVER_ID,
        mediaUrl: this.GET_ACTIVE_MEDIA_METADATA[this.imageType],
        width: 100,
        height: 300,
      });
    },

    imageType() {
      switch (this.GET_ACTIVE_MEDIA_METADATA.type) {
        case 'movie':
          return 'thumb';
        case 'show':
          return 'parentThumb';
        case 'episode':
          return 'grandparentThumb';
        default:
          return 'thumb';
      }
    },
  },
};
</script>

<style scoped>
.nowplaying {
  max-width: 300px;
}
</style>
