<template>
  <router-link :to="href">
    <v-card
      color="blue darken-4"
      hover
      style="height: 100%; width: 230px"
    >
      <v-layout
        row
        wrap
        justify-center
        align-center
      >
        <v-flex
          md2
          class="hidden-xs-only text-center"
        >
          <img
            :src="thumb"
            style="height: 52px; vertical-align: middle"
          >
        </v-flex>
        <v-flex
          md10
          xs12
          class="pl-3 pa-1 text-xs-left"
          style="overflow: hidden; white-space: nowrap; line-height: 24px"
        >
          <div style="font-size: 18px">
            Now Playing
          </div>
          <div><small><b>{{ getTitle }}</b> - {{ getUnder }}</small></div>
        </v-flex>
      </v-layout>
    </v-card>
  </router-link>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  components: {
  },
  data() {
    return {

    };
  },
  computed: {
    ...mapGetters([
      'GET_CHOSEN_CLIENT',
      'getPlex',
    ]),

    item() {
      return this.GET_CHOSEN_CLIENT.clientPlayingMetadata;
    },
    href() {
      return `/nowplaying/${this.item.machineIdentifier}/${this.item.ratingKey}`;
    },
    plexserver() {
      if (!this.item) return null;
      return this.getPlex.servers[this.GET_CHOSEN_CLIENT.lastTimelineObject.machineIdentifier];
    },
    thumb() {
      if (!this.item) return '';
      return this.plexserver.getUrlForLibraryLoc(this.item[this.imageType], 100, 300);
    },
    imageType() {
      switch (this.item.type) {
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
    getTitle() {
      switch (this.item.type) {
        case 'movie':
          if (this.fullTitle !== undefined) {
            if (this.item.year) {
              return `${this.item.title} (${this.item.year})`;
            }
          }
          return this.item.title;
        case 'show':
          return this.item.title;
        case 'season':
          return this.item.title;
        case 'episode':
          return this.item.grandparentTitle;
        default:
          return this.item.title;
      }
    },
    getUnder() {
      switch (this.item.type) {
        case 'movie':
          if (this.item.year) {
            return this.item.year;
          }
          return ' ';
        case 'show':
          if (this.item.childCount === 1) {
            return `${this.item.childCount} season`;
          }
          return `${this.item.childCount} seasons`;
        case 'season':
          return `${this.item.leafCount} episodes`;
        case 'album':
          return this.item.year;
        case 'artist':
          return '';
        case 'episode':
          return (
            ` S${
              this.item.parentIndex
            }E${
              this.item.index
            } - ${
              this.item.title}`
          );
        default:
          return this.item.title;
      }
    },
  },
};
</script>
