<template>
  <div
    ref="root"
    class="portrait"
    style="cursor: pointer"
    @mouseover="hovering = true"
    @mouseout="hovering = false"
  >
    <router-link :to="link">
      <v-card
        flat
        class="grey darken-4 elevation-20"
        style="border-radius: 0px !important"
        @click.native="emitContentClicked(content)"
      >
        <v-img
          data-tilt
          class="white--text"
          style="position:relative"
          :height="calculatedHeight"
          :src="getImg(content)"
        >
          <v-container
            class="pa-0 ma-0"
            fill-height
            fluid
            style="position:relative"
          >
            <v-row>
              <v-col xs12>
                <small
                  v-if="showServer !== undefined"
                  class="ma-1"
                  style="position:absolute; top:0;text-align:right;right:0;
                  background: rgba(0, 0, 0, .5)"
                >
                  {{ server.name }}</small>
                <div
                  v-if="showUnwatchedFlag && showServer == undefined"
                  class="pt-content-unwatched pt-orange unwatched"
                >
                  <span class="pa-2 black--text">
                    <span>
                      {{ unwatchedCount }}
                    </span>
                  </span>
                </div>
                <div
                  v-if="content.Media && content.Media.length != 1 && showServer == undefined"
                  style="position:absolute; right:0; background-color: rgba(43, 43, 191, 0.8)"
                >
                  <span class="pa-2 black--text">
                    <span>
                      {{ content.Media.length }}
                    </span>
                  </span>
                </div>
                <v-container
                  fill-height
                  fluid
                  class="pa-0"
                  style="max-width:100%"
                >
                  <v-row
                    justify="end"
                    align="end"
                  >
                    <v-col xs12>
                      <v-progress-linear
                        v-if="showProgressBar"
                        style="width:100%"
                        class="pa-0 mb-0 ma-0 pt-content-progress"
                        height="1"
                        :value="unwatchedPercent"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-col>
            </v-row>
          </v-container>
        </v-img>
      </v-card>

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
          ref="bottomText"
          cols="12"
          style="font-size:0.7rem"
        >
          <div class="truncate soft-text">
            {{ getSecondaryTitle(content) }}
          </div>
        </v-col>
      </v-row>
    </router-link>
  </div>
</template>

<script>
import VanillaTilt from 'vanilla-tilt';
import contentTitle from '@/mixins/contentTitle';

export default {
  mixins: [contentTitle],
  props: {
    showServer: {
      type: Boolean,
    },

    content: {
      type: Object,
      default: () => {},
    },

    type: {
      type: String,
      default: '',
    },

    server: {
      type: Object,
      default: () => {},
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
      fullheight: null,
      fullwidth: null,
      toptextheight: null,
      bottomtextheight: null,

      hovering: false,
    };
  },
  computed: {
    plex() {
      return this.$store.getters.getPlex;
    },
    serverId() {
      return (
        this.$route.params.machineIdentifier
        || this.server.clientIdentifier
        || this.$route.params.clientIdentifier
      );
    },
    link() {
      if (this.content.type === 'episode') {
        let final = `/browse/${this.serverId}`;
        const exists = this.content.librarySectionID;
        if (exists) {
          final = `${final}/${this.content.librarySectionID}`;
        }
        final = `${final}/tv/${this.content.grandparentRatingKey}/${this.content.parentRatingKey}/${this.content.ratingKey}`;
        return final;
      }
      if (this.content.type === 'season') {
        return `/browse/${this.serverId}/${this.content.librarySectionID}/tv/${this.content.parentRatingKey}/${this.content.ratingKey}`;
      }
      if (this.content.type === 'series' || this.content.type === 'show') {
        return `/browse/${this.serverId}/${this.content.librarySectionID}/tv/${this.content.ratingKey}`;
      }
      return `/browse/${this.serverId}/${this.content.librarySectionID}/${this.content.ratingKey}`;
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
    fontSizeTop() {
      let size = this.toptextheight * 0.7;
      if (size > 18) {
        size = 18;
      }
      return { 'font-size': `${size}px` };
    },
    fontSizeBottom() {
      let size = this.bottomtextheight * 0.7;
      if (size > 14) {
        size = 14;
      }
      return { 'font-size': `${size * 1}px` };
    },
    onlyBottom() {
      if (this.bottomOnly !== undefined || this.bottomOnly !== null) {
        return true;
      }
      return false;
    },
    hideThumb() {
      return this.spoilerFilter;
    },
    fullCalculatedHeightRaw() {
      if (this.height) {
        return this.height;
      }
      if (this.content.type === 'movie') {
        return Math.round(this.fullwidth * 1.5);
      }
      if (this.content.type === 'episode') {
        return Math.round(this.fullwidth * 0.7);
      }
      return Math.round(this.fullwidth * 1.5);
    },
    fakeRowHeight() {
      if (this.height) {
        return `${Math.round(this.height * 0.78)}em`;
      }
      if (this.content.type === 'movie') {
        return `${Math.round(this.fullwidth * 1.5 * 0.78)}px`;
      }
      if (this.content.type === 'episode') {
        return `${Math.round(this.fullwidth * 0.7 * 0.78)}px`;
      }
      return `${Math.round(this.fullwidth * 1.5 * 0.78)}px`;
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
    bottomCalculatedHeight() {
      if (this.height && this.type === 'thumb') {
        return `${Math.round(this.height * 0.22)}em`;
      }
      if (this.height && this.type === 'art') {
        return `${Math.round(this.height * 0.15)}em`;
      }
      if (this.content.type === 'movie') {
        return `${Math.round(this.fullwidth * 1.5 * 0.22)}px`;
      }
      if (this.content.type === 'episode') {
        return `${Math.round(this.fullwidth * 0.7 * 0.22)}px`;
      }
      return `${Math.round(this.fullwidth * 1.5 * 0.22)}px`;
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
    this.fullheight = this.$refs.root.offsetHeight;
    this.fullwidth = this.$refs.root.offsetWidth;
    if (this.$refs.topText) {
      this.toptextheight = this.$refs.topText.offsetHeight;
    }
    if (this.$refs.bottomText) {
      this.bottomtextheight = this.$refs.bottomText.offsetHeight;
    }
    if (this.type === 'thumb') {
      VanillaTilt.init(this.$refs.root, {
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
      this.fullheight = this.$refs.root.offsetHeight;
      this.fullwidth = this.$refs.root.offsetWidth;
      if (this.$refs.topText) {
        this.toptextheight = this.$refs.topText.offsetHeight;
      }
      if (this.$refs.bottomText) {
        this.bottomtextheight = this.$refs.bottomText.offsetHeight;
      }
    },
    getImg(object) {
      const w = Math.round(this.fullwidth * 2);
      if (this.type === 'thumb') {
        return this.server.getUrlForLibraryLoc(object.thumb, w, 1000);
      }
      if (
        !this.hovering
        && this.hideThumb
        && (!this.content.viewCount || this.content.viewCount === 0)
      ) {
        return this.server.getUrlForLibraryLoc(object.art, w, 1000);
      }
      if (this.img) {
        return this.img;
      }
      if (this.type === 'art') {
        return this.server.getUrlForLibraryLoc(object.art, w, 1000);
      }
      return this.server.getUrlForLibraryLoc(object.thumb, w, 1000);
    },
    reset() {
      this.browsingContent = false;
    },
  },
};
</script>
