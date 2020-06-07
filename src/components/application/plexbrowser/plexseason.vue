<template>
  <span>
    <v-layout
      v-if="!contents"
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
      v-else
      class="mt-3"
    >
      <v-flex xs12>
        <v-card
          class="darken-2 white--text"
          :img="getArtUrl"
        >
          <v-container
            style="background: rgba(0, 0, 0, .6);"
            class="pa-0 ma-0"
            fluid
            grid-list-lg
          >
            <v-layout
              row
              style="height:100%"
            >
              <v-flex
                xs12
                md3
                class="hidden-sm-and-down"
              >
                <v-img
                  :src="getThumb"
                  class="ma-0 pa-0"
                  height="25em"
                  contain
                />
              </v-flex>
              <v-flex
                xs12
                md9
                style="position:relative"
                class="ma-2"
              >
                <div>
                  <h1> {{ contents.MediaContainer.title1 }}</h1>
                  <h3 style="font-weight:bold">{{ contents.MediaContainer.title2 }}</h3>
                  <p> {{ contents.MediaContainer.size }} episodes </p>
                  <v-divider />
                  <p
                    style="font-style: italic"
                    class="pt-3; overflow: hidden"
                  > {{ contents.summary }} </p>
                  <div>
                    <div
                      style="float:right"
                      class="pa-4"
                    >
                      <v-chip
                        v-if="contents.MediaContainer.grandparentContentRating"
                        label
                        color="grey"
                      > {{ contents.MediaContainer.grandparentContentRating }}</v-chip>
                      <v-chip
                        v-if="contents.MediaContainer.grandparentStudio"
                        secondary
                        color="grey"
                      > {{ contents.MediaContainer.grandparentStudio }}</v-chip>
                    </div>
                  </div>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <h4 class="mt-3"> Episodes </h4>
      <v-divider />
      <div>
        <v-layout
          class="row mt-3"
          row
          wrap
        >
          <v-flex
            v-for="content in contents.MediaContainer.Metadata"
            :key="content.key"
            xs6
            md2
            class="pb-3"
          >
            <plexthumb
              :content="content"
              :server="plexserver"
              type="thumb"
              style="margin:2%"
              full-title
              @contentSet="setContent(content)"
            />
          </v-flex>
        </v-layout>
      </div>
    </div>
  </span>
</template>

<script>
import plexthumb from './plexthumb.vue';

export default {
  components: {
    plexthumb,
  },
  data() {
    return {
      browsingContent: null,

      contents: null,
      status: 'loading..',
    };
  },
  computed: {
    getArtUrl() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
      return this.plexserver.getUrlForLibraryLoc(this.contents.MediaContainer.banner,
        w / 2, h / 1, 2);
    },
    getThumb() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));

      return this.plexserver.getUrlForLibraryLoc(
        this.contents.MediaContainer.thumb || this.contents.MediaContainer.grandparentThumb
          || this.contents.MediaContainer.parentThumb,
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
    this.plexserver.getSeriesChildren(this.$route.params.ratingKey,
      0, 500, 1, this.$route.params.sectionId)
      .then((result) => {
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
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));

      this.$store.commit('SET_BACKGROUND', this.plexserver.getUrlForLibraryLoc(this.contents.MediaContainer.art, w / 4, h / 4, 2));
    },
    reset() {
      this.browsingContent = false;
      this.setBackground();
    },
  },
};
</script>
