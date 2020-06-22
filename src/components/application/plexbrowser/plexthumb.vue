<template>
  <v-card
    :to="link"
    flat
    tile
    color="transparent"
    @mouseover="hovering = true"
    @mouseout="hovering = false"
    @click.native="emitContentClicked(content)"
  >
    <v-img
      data-tilt
      class="white--text"
      style="position:relative"
      :height="calculatedHeight"
      :src="imgUrl"
    >
      <v-container
        class="pa-0 ma-0"
        fill-height
        fluid
        style="position:relative"
      >
        <v-row>
          <v-col cols="12">
            <small
              v-if="showServer"
              class="ma-1"
              style="position:absolute; top:0;text-align:right;right:0;
                  background: rgba(0, 0, 0, .5)"
            >
              {{ GET_PLEX_SERVER(machineIdentifier).name }}</small>

            <div
              v-if="showUnwatchedFlag && !showServer"
              class="pt-content-unwatched pt-orange unwatched pa-1 text-body-2"
              style="min-width: 16px; min-height: 16px"
            >
              {{ unwatchedCount }}
            </div>

            <div
              v-if="content.Media && content.Media.length != 1 && !showServer"
              style="position:absolute; right:0; background-color: rgba(43, 43, 191, 0.8);
                   min-width: 16px; min-height: 16px"
              class="pa-1 text-body-2"
            >
              {{ content.Media.length }}
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-img>

    <v-progress-linear
      v-if="showProgressBar"
      v-slot:progress
      style="width:100%"
      class="pa-0 mb-0 ma-0 pt-content-progress"
      height="1"
      :value="unwatchedPercent"
    />

    <v-card-text class="pa-0">
      <v-row
        dense
        no-gutters
        align="end"
        class="text-xs-left pa-1 white--text"
        style="max-width: 100%"
      >
        <v-col
          v-if="!bottomOnly"
          cols="12"
          style="max-width: 100%"
        >
          <div
            class="truncate"
            style="font-size:0.9rem"
          >
            {{ getTitle(content) }}
          </div>
        </v-col>

        <v-col
          cols="12"
          style="font-size:0.7rem"
        >
          <div class="truncate soft-text">
            {{ getSecondaryTitle(content) }}
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';
import VanillaTilt from 'vanilla-tilt';
import contentTitle from '@/mixins/contentTitle';
import contentLinks from '@/utils/contentlinks';

export default {
  mixins: [contentTitle],

  props: {
    showServer: {
      type: Boolean,
    },

    machineIdentifier: {
      type: String,
      required: true,
    },

    content: {
      type: Object,
      default: () => {},
    },

    type: {
      type: String,
      default: '',
    },

    height: {
      type: Number,
      default: 0,
    },

    fullTitle: {
      type: Boolean,
    },

    img: {
      type: String,
      default: '',
    },

    bottomOnly: {
      type: Boolean,
    },

    spoilerFilter: {
      type: Boolean,
    },
  },

  data() {
    return {
      fullwidth: null,
      hovering: false,
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    imgUrl() {
      const width = Math.round(this.fullwidth * 2);
      if (this.type === 'thumb') {
        return this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.content.thumb,
          width,
          height: 1000,
        });
      }

      if (!this.hovering && this.spoilerFilter && !this.content.viewCount) {
        return this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.content.art,
          width,
          height: 1000,
        });
      }

      if (this.img) {
        return this.img;
      }

      if (this.type === 'art') {
        return this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.content.art,
          width,
          height: 1000,
        });
      }

      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.content.thumb,
        width,
        height: 1000,
      });
    },

    link() {
      return contentLinks.getContentLink({
        ...this.content,
        machineIdentifier: this.machineIdentifier,
      });
    },

    showUnwatchedFlag() {
      if (this.content.type === 'movie' || this.content.type === 'episode') {
        return (!this.content.viewCount || this.content.viewCount === 0) && !this.showProgressBar;
      }

      if (this.content.type === 'season' || this.content.type === 'show') {
        return this.content.leafCount !== this.content.viewedLeafCount;
      }

      return false;
    },

    calculatedHeight() {
      if (this.height) {
        return `${this.height}em`;
      }

      if (this.type === 'art') {
        return `${Math.round(this.fullwidth * 0.7)}px`;
      }

      if (this.content.type === 'movie') {
        return `${Math.round(this.fullwidth * 1.5)}px`;
      }

      if (this.content.type === 'episode') {
        return `${Math.round(this.fullwidth * 0.7)}px`;
      }
      return `${Math.round(this.fullwidth * 1.5)}px`;
    },

    showProgressBar() {
      if (this.content.type === 'movie' || this.content.type === 'episode') {
        return this.content.viewOffset && this.content.viewOffset > 0;
      }

      if (this.content.type === 'season' || this.content.type === 'show') {
        return (
          this.content.leafCount !== this.content.viewedLeafCount
          && this.content.viewedLeafCount !== 0
        );
      }

      return false;
    },

    unwatched() {
      if (this.content.type === 'movie' || this.content.type === 'episode') {
        return !(this.content.viewCount && this.content.viewCount > 0);
      }

      return false;
    },

    unfinished() {
      // Lol
      if (this.content.type === 'movie' || this.content.type === 'episode') {
        return !this.content.viewCount && !this.content.viewOffset;
      }

      if (this.content.viewedLeafCount === 0) {
        return false;
      }

      if (this.content.leafCount - this.content.viewedLeafCount < 1) {
        return false;
      }

      return true;
    },

    unwatchedCount() {
      if (this.content.type === 'show' || this.content.type === 'season') {
        return this.content.leafCount - this.content.viewedLeafCount;
      }
      return '';
    },

    unwatchedPercent() {
      if (this.content.type === 'movie' || this.content.type === 'episode') {
        return (this.content.viewOffset / this.content.duration) * 100;
      }
      return (this.content.viewedLeafCount / this.content.leafCount) * 100;
    },
  },

  created() {
    window.addEventListener('resize', this.handleResize);
  },

  mounted() {
    this.fullwidth = this.$el.offsetWidth;

    if (this.type === 'thumb') {
      VanillaTilt.init(this.$el, {
        reverse: true, // reverse the tilt direction
        max: 7, // max tilt rotation (degrees)
        perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
        scale: 1.01, // 2 = 200%, 1.5 = 150%, etc..
        speed: 100, // Speed of the enter/exit transition
        transition: true, // Set a transition on enter/exit.
        axis: null, // What axis should be disabled. Can be X or Y.
        reset: true, // If the tilt effect has to be reset on exit.
        easing: 'cubic-bezier(.03,.98,.52,.99)', // Easing on enter/exit.
        glare: false, // if it should have a "glare" effect
        'max-glare': 0.15, // the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
        'glare-prerender': false, // false = VanillaTilt creates the glare elements for you, otherwise
      });
    }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    emitContentClicked(content) {
      this.$emit('contentSet', content);
    },

    handleResize() {
      this.fullwidth = this.$el.offsetWidth;
    },
  },
};
</script>
