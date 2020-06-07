<template>
  <span style="max-height: 90%">
    <v-layout
      v-if="!contents && !browsingContent"
      row
      justify-center
      align-start
    >
      <v-flex
        xs12
        style="position:relative"
      >
        <v-progress-circular
          style="left: 50%; top:50%"
          :size="60"
          indeterminate
          class="amber--text"
        />
      </v-flex>
    </v-layout>
    <div
      v-if="!browsingContent && contents"
      class="mt-3"
      style="height:90vh; overflow-y: auto"
    >
      <v-layout
        class="row"
        row
        wrap
      >
        <v-flex
          v-for="content in contents.MediaContainer.Metadata"
          :key="content.key"
          xs3
          sm3
          md1
          lg1
          class="ma-1"
        >
          <plexthumb
            :content="content"
            :server="server"
            type="thumb"
            style="margin:7%"
            @contentSet="setContent(content)"
          />
        </v-flex>
      </v-layout>
      <v-layout row>
        <v-flex
          v-if="contents && !browsingContent && !stopNewContent"
          v-observe-visibility="getMoreContent"
          xs12
          justify-center
        >
          Loading...
        </v-flex>
      </v-layout>
    </div>
  </span>
</template>

<script>
import plexthumb from './plexthumb.vue';

const _ = require('lodash');

export default {
  components: {
    plexthumb,
  },

  data() {
    return {
      browsingContent: null,
      startingIndex: 0,
      size: 100,
      libraryTotalSize: false,

      stopNewContent: false,
      busy: false,
      contents: null,
      status: 'loading..',
      searchPhrase: null,
    };
  },

  computed: {
    server() {
      return this.plex.servers[this.$route.params.machineIdentifier];
    },
  },

  created() {
    // Hit the PMS endpoing /library/sections
    this.getMoreContent();
  },

  methods: {
    setContent(content) {
      this.browsingContent = content;
    },

    getThumb(object) {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
      return this.server.getUrlForLibraryLoc(object.thumb, w / 6, h / 4);
    },
    setBackground() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));

      const randomItem = _.sample(this.contents.MediaContainer.Metadata);
      let url = randomItem.thumb;
      if (randomItem.type === 'show') {
        url = randomItem.art;
      }
      this.$store.commit('SET_BACKGROUND', this.server.getUrlForLibraryLoc(url, w / 4, h / 4, 8));
    },

    isShown(item) {
      if (!item.active) {
        return {
          display: 'none',
        };
      }
      return {};
    },

    getTitleMovie(movie) {
      if (movie.year) {
        return `${movie.title} (${movie.year})`;
      }
      return movie.title;
    },

    filterItems: _.debounce(() => {
      for (let i = 0; i < this.contents.MediaContainer.Metadata.length; i += 1) {
        const item = this.contents.MediaContainer.Metadata[i];
        if (!this.searchPhrase) {
          item.active = true;
        } else if (item.title.toLowerCase().indexOf(this.searchPhrase.toLowerCase()) > -1) {
          item.active = true;
        } else {
          item.active = false;
        }
      }
    }, 500),

    getMoreContent() {
      if (this.stopNewContent || this.busy) {
        return;
      }

      this.busy = true;
      this.server.getLibraryContents(this.$route.params.sectionId, this.startingIndex, this.size)
        .then((result) => {
          if (result && result.MediaContainer && result.MediaContainer.Metadata) {
            this.libraryTotalSize = result.MediaContainer.totalSize;
            this.startingIndex += 100;
            if (this.contents) {
              for (let i = 0; i < result.MediaContainer.Metadata.length; i += 1) {
                const media = result.MediaContainer.Metadata[i];
                media.active = true;
                this.contents.MediaContainer.Metadata.push(media);
              }
            } else {
              for (let i = 0; i < result.MediaContainer.Metadata.length; i += 1) {
                const media = result.MediaContainer.Metadata[i];
                media.active = true;
              }
              this.contents = result;
              this.setBackground();
            }
            if (result.MediaContainer.size < 100) {
              this.stopNewContent = true;
            }
          } else {
            this.status = 'Error loading libraries!';
          }
          this.busy = false;
        });
    },

    reset() {
      this.browsingContent = false;
      this.setBackground();
    },

  },
};
</script>
