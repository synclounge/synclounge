<template>
  <v-card
    :to="href"
    color="blue darken-4"
    hover
    style="height: 100%; width: 230px"
  >
    <v-row
      justify="center"
      align="center"
    >
      <v-col
        md="2"
        class="hidden-xs-only text-center"
      >
        <img
          :src="thumb"
          style="height: 52px; vertical-align: middle"
        >
      </v-col>

      <v-col
        cols="12"
        md="10"
        class="pl-3 pa-1 text-xs-left"
        style="overflow: hidden; white-space: nowrap; line-height: 24px"
      >
        <div style="font-size: 18px">
          Now Playing
        </div>

        <div>
          <small>
            <b>{{ getTitle(GET_ACTIVE_MEDIA_METADATA) }}</b> -
            {{ getSecondaryTitle(GET_ACTIVE_MEDIA_METADATA) }}
          </small>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';

import contentTitle from '@/mixins/contentTitle';

export default {
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
      return {
        name: 'nowplaying',
        params: {
          machineIdentifier: this.GET_ACTIVE_SERVER_ID,
          ratingKey: this.GET_ACTIVE_MEDIA_METADATA.ratingKey,
        },
      };
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
