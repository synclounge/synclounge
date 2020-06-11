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
      v-if="contents"
      class="mt-3"
    >
      <v-flex
        xs12
        style="background: rgba(0, 0, 0, .4);"
      >
        <v-card
          class="darken-2 white--text"
          :img="getArtUrl"
        >
          <v-container
            style="background:rgba(0,0,0,0.6)"
            class="pa-3 ma-0"
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
                  :src="thumb"
                  class="ma-0 pa-0 hidden-sm-and-down"
                  height="25em"
                  contain
                />
              </v-flex>
              <v-flex
                xs12
                md9
                class="ma-2"
              >
                <div>
                  <h1> {{ contents.parentTitle }}</h1>
                  <h3 style="font-weight:bold">{{ contents.title }}</h3>
                  <p> {{ getSeasons }} - {{ contents.parentYear }} </p>
                  <v-divider />
                  <p
                    style="font-style: italic"
                    class="pt-3; overflow: hidden"
                  > {{ contents.summary }} </p>
                  <div>
                    <v-chip
                      v-for="genre in genres"
                      :key="genre.tag"
                      label
                      color="grey"
                    >
                      {{ genre.tag }}
                    </v-chip>
                  </div>
                  <v-subheader class="white--text"> Featuring </v-subheader>
                  <v-layout
                    v-if="seriesData"
                    row
                    wrap
                  >
                    <v-flex
                      v-for="role in roles"
                      :key="role.tag"
                      xs12
                      md6
                      lg4
                    >
                      <v-chip style="border: none; background: none; color: white">
                        <v-avatar>
                          <img :src="role.thumb">
                        </v-avatar>
                        {{ role.tag }}
                        <div
                          style="opacity:0.7;font-size:80% "
                          class="pa-2"
                        > {{ role.role }} </div>
                      </v-chip>
                    </v-flex>
                  </v-layout>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
      <h4 class="mt-3"> Seasons </h4>
      <v-layout
        class="row"
        row
        wrap
      >
        <v-flex
          v-for="content in contents.Metadata"
          :key="content.key"
          xs4
          md2
          xl1
          lg1
          class="pb-3"
        >
          <plexthumb
            :content="content"
            :server="plexServer"
            type="thumb"
            style="margin:7%"
          />
        </v-flex>
      </v-layout>
    </div>
  </span>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  components: {
    plexthumb: () => import('./plexthumb.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },

    sectionId: {
      type: String,
      required: true,
    },

    ratingKey: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      browsingContent: null,
      startingIndex: 0,
      size: 150,

      contents: null,
      seriesData: null,
      status: 'loading..',
    };
  },

  computed: {
    ...mapGetters([
      'GET_PLEX_SERVER',
    ]),

    plexServer() {
      return this.GET_PLEX_SERVER(this.machineIdentifier);
    },

    getArtUrl() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
      return this.plexServer.getUrlForLibraryLoc(this.contents.banner, w / 1, h / 1, 2);
    },

    getSeasons() {
      if (this.contents.size === 1) {
        return `${this.contents.size} season`;
      }
      return `${this.contents.size} seasons`;
    },

    roles() {
      if (!this.seriesData) {
        return [];
      }
      return this.seriesData.MediaContainer.Metadata[0].Role.slice(0, 6);
    },

    genres() {
      if (!this.seriesData) {
        return [];
      }
      return this.seriesData.MediaContainer.Metadata[0].Genre.slice(0, 5);
    },

    thumb() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
      return this.plexServer.getUrlForLibraryLoc(this.contents.thumb || this.contents.parentThumb
        || this.contents.grandparentThumb, w / 1, h / 1);
    },
  },

  created() {
    // Hit the PMS endpoing /library/sections
    this.plexServer.getSeriesChildren(this.ratingKey, this.startingIndex,
      this.size, 1, this.sectionId).then((result) => {
      if (result) {
        this.contents = result.MediaContainer;
        this.setBackground();
      } else {
        this.status = 'Error loading libraries!';
      }
    }).catch(() => {});

    this.plexServer.getSeriesData(this.ratingKey).then((res) => {
      if (res) {
        this.seriesData = res;
      }
    }).catch(() => {});
  },

  methods: {
    setBackground() {
      const w = Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
      this.$store.commit('SET_BACKGROUND', this.server.getUrlForLibraryLoc(this.contents.art, w / 4, h / 4, 2));
    },
  },
};
</script>
