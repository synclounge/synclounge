<template>
  <span>
    <span
      style="cursor: pointer !important"
      @click="reset()"
    > {{ content.title }}<span
      v-if="browsingContent"
    > > </span> </span>
    <v-layout
      v-if="!contents && !browsingContent"
      row
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
      v-if="contents && !browsingContent"
      class="mt-3"
    >
      <v-card
        horizontal
        height="25em"
        :img="getArtUrl"
      >
        <v-card-row
          class="hidden-sm-and-down"
          :img="getThumb"
          height="100%"
        />
        <v-card-column style="background: rgba(0, 0, 0, .4)">
          <v-card-row
            height="11em"
            class="white--text"
          >
            <v-card-text>
              <h3> {{ content.title }}</h3>
              <p> {{ contents.MediaContainer.summary }} </p>
            </v-card-text>
          </v-card-row>
          <v-card-row actions>
            <v-chip
              v-for="genre in content.Genre"
              :key="genre"
              v-tooltip:top="{ html: 'Genre' }"
              label
            > {{ genre.tag }}</v-chip>
            <v-chip
              v-for="country in content.Country"
              :key="country"
              v-tooltip:top="{ html: 'Country' }"
            > {{ country.tag }}</v-chip>
          </v-card-row>
        </v-card-column>
      </v-card>
      <h4 class="mt-3"> Albums </h4>
      <v-divider />
      <div>
        <v-layout
          class="row mt-3"
          row
          wrap
        >
          <v-flex
            v-for="content in contents.MediaContainer.Metadata"
            :key="content"
            xs6
            md3
            xl1
            lg2
            class="pb-3"
          >
            <plexthumb
              :content="content"
              :server="server"
              type="thumb"
              full-title
              @contentSet="setContent(content)"
            />
          </v-flex>
        </v-layout>
      </div>
    </div>
    <plexalbum
      v-if="browsingContent && browsingContent.type == 'album'"
      :content="browsingContent"
      :server="server"
      :library="library"
    />
    <plexcontent
      v-if="browsingContent && browsingContent.type != 'album'"
      :content="browsingContent"
      :server="server"
      :library="library"
    />
  </span>
</template>

<script>
import plexcontent from './plexcontent';
import plexalbum from './plexalbum';
import plexthumb from './plexthumb.vue';

export default {
  components: {
    plexcontent,
    plexthumb,
    plexalbum,
  },
  props: ['library', 'server', 'content'],
  data() {
    return {
      browsingContent: null,

      contents: null,
      status: 'loading..',
    };
  },
  computed: {
    getArtUrl() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.banner,
        w / 2,
        h / 1,
        5,
      );
    },
    getThumb() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.thumb,
        w / 1,
        h / 2,
      );
    },
  },
  watch: {
    browsingContent() {
      if (!this.browsingContent) {
        this.$store.commit('SET_BACKGROUND', null);
      }
    },
  },
  created() {
    // Hit the PMS endpoing /library/sections
    this.server.getSeriesContent(this.content.key, 0, 500, 1, (result) => {
      if (result) {
        this.contents = result;
        this.setBackground();
      } else {
        this.status = 'Error loading content!';
      }
    });
  },
  mounted() {},
  beforeDestroy() {},
  methods: {
    setContent(content) {
      this.browsingContent = content;
    },
    setBackground() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

      this.$store.commit(
        'SET_BACKGROUND',
        this.server.getUrlForLibraryLoc(
          this.contents.MediaContainer.art,
          w / 4,
          h / 4,
          8,
        ),
      );
    },
    reset() {
      this.browsingContent = false;
      this.setBackground();
    },
  },
};
</script>
