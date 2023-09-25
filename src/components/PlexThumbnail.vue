<template>
  <v-card
    :to="contentLink(content)"
    flat
    tile
    color="transparent"
    @mouseover="hovering = true"
    @mouseout="hovering = false"
  >
    <v-img
      data-tilt
      :aspect-ratio="1 / inverseAspectRatio"
      style="position: relative;"
      :src="imgUrl"
      :srcset="srcset"
      :sizes="sizes"
    >
      <v-container
        class="pa-0 ma-0"
        fill-height
        fluid
        style="position: relative;"
      >
        <v-row>
          <v-col cols="12">
            <small
              v-if="showServer"
              class="ma-1 server-name"
            >
              {{ GET_PLEX_SERVER(content.machineIdentifier).name }}</small>

            <div
              v-if="showUnwatchedFlag && !showServer"
              class="unwatched primary pa-1 text-body-2"
            >
              {{ unwatchedCount }}
            </div>

            <div
              v-if="content.Media && content.Media.length > 1 && !showServer"
              style="position: absolute;
                    top: 0;
                    right: 0;
                    background-color: rgb(43 43 191 / 80%);
                    min-width: 16px;
                    min-height: 16px;"
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
      rounded
      class="pa-0 mb-0 ma-0 pt-content-progress"
      height="4"
      :value="unwatchedPercent"
    />

    <v-tooltip
      bottom
      nudge-top="10"
    >
      <template #activator="{ on, attrs }">
        <v-row
          v-bind="attrs"
          dense
          no-gutters
          align="end"
          class="pa-1"
          style="max-width: 100%;"
          v-on="on"
        >
          <v-col
            cols="12"
            class="text-subtitle-2 text-truncate"
          >
            {{ getTitle(content, fullTitle) }}
          </v-col>

          <v-col
            cols="12"
            class="text-caption text-truncate text--secondary"
          >
            {{ getSecondaryTitle(content, fullTitle) }}
          </v-col>

          <v-col
            v-if="content.reason"
            cols="12"
            class="text-caption text-truncate text--secondary"
          >
            {{ getReasonTitle(content) }}
          </v-col>
        </v-row>
      </template>

      <div>{{ getTitle(content, fullTitle) }}</div>

      <div class="text-caption text--secondary">
        {{ getSecondaryTitle(content, fullTitle) }}
      </div>

      <div
        v-if="content.reason"
        class="text-caption text--secondary"
      >
        {{ getReasonTitle(content) }}
      </div>
    </v-tooltip>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';
import VanillaTilt from 'vanilla-tilt';
import contentTitle from '@/mixins/contentTitle';
import { getAppWidth, getAppHeight } from '@/utils/sizing';
import contentLink from '@/mixins/contentlink';

const imageWidths = [
  100, 200, 300, 400, 600, 800, 1000, 2000, 4000, 8000,
];

// This order is important (biggest to smallest)
const breakpoints = ['xl', 'lg', 'md', 'sm'];
const breakpointProps = (() => breakpoints.reduce((props, val) => ({
  ...props,
  [val]: {
    type: [Boolean, String, Number],
    default: false,
  },
}), {}))();

const getSizeValue = (cols) => `calc((100vw - 24px) / (12 / ${cols}) - 24px)`;

const getSrcSize = (minWidth, cols) => `(min-width: ${minWidth}px) ${getSizeValue(cols)}`;

export default {
  name: 'PlexThumbnail',

  mixins: [
    contentTitle,
    contentLink,
  ],

  props: {
    showServer: {
      type: Boolean,
    },

    content: {
      type: Object,
      required: true,
    },

    type: {
      type: String,
      default: '',
    },

    spoilerFilter: {
      type: Boolean,
    },

    fullTitle: {
      type: Boolean,
    },

    cols: {
      type: [String, Number],
      default: 12,
    },
    ...breakpointProps,
  },

  data: () => ({
    hovering: false,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    mediaUrl() {
      return (!this.hovering && this.spoilerFilter && !this.content.viewCount)
      || this.type === 'art'
        ? this.content.art
        : this.content.thumb;
    },

    // 1 / aspect ratio
    inverseAspectRatio() {
      // Movie posters have 2:3 aspect ratio
      return this.type === 'art' || this.content.type === 'episode'
        ? 9 / 16
        : 3 / 2;
    },

    imgUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.content.machineIdentifier,
        mediaUrl: this.mediaUrl,
        width: getAppWidth(),
        height: getAppHeight(),
      });
    },

    srcset() {
      return imageWidths.map((width) => `${this.getImageUrl(width)} ${width}w`).join(' ,');
    },

    // Object with keys of breakpoint codes and values of their minumum width
    breakpointMins() {
      const {
        xs, sm, md, lg,
      } = this.$vuetify.breakpoint.thresholds;

      return {
        xl: lg,
        lg: md,
        md: sm,
        sm: xs,
      };
    },

    sizes() {
      const usedBreakpointSrcSizes = breakpoints.filter((code) => this[code])
        .map((code) => getSrcSize(this.breakpointMins[code], this[code]));

      const srcSizes = [
        ...usedBreakpointSrcSizes,
        getSizeValue(this.cols),
      ];

      return srcSizes.join(', ');
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

  mounted() {
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
        'glare-prerender': false, // false = VanillaTilt creates the glare elements for you
      });
    }
  },

  beforeDestroy() {
    if (this.$el.vanillaTilt) {
      this.$el.vanillaTilt.destroy();
    }
  },

  methods: {
    getImageUrl(width) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.content.machineIdentifier,
        mediaUrl: this.mediaUrl,
        width,
        height: Math.round(width * this.inverseAspectRatio),
      });
    },
  },
};
</script>

<style scoped>
.unwatched {
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  min-width: 16px;
  min-height: 16px;
}

.server-name {
  position: absolute;
  top: 0;
  text-align: right;
  right: 0;
  background: rgb(0 0 0 / 50%);
}
</style>
