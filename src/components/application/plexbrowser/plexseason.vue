<template>
  <v-row
    v-if="!metadata"
  >
    <v-col
      cols="12"
      style="position:relative"
    >
      <v-progress-circular
        style="left: 50%; top:50%"
        :size="60"
        indeterminate
        class="amber--text"
      />
    </v-col>
  </v-row>

  <v-container
    v-else
    class="mt-3"
  >
    <v-row>
      <v-col cols="12">
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
            <v-row
              style="min-height:100%"
            >
              <v-col
                cols="12"
                md="3"
                class="hidden-sm-and-down"
              >
                <v-img
                  :src="getThumb"
                  class="ma-0 pa-0"
                  height="25em"
                  contain
                />
              </v-col>

              <v-col
                cols="12"
                md="9"
                style="position:relative"
              >
                <div>
                  <h1> {{ metadata.parentTitle }}</h1>
                  <h3 style="font-weight:bold">
                    {{ metadata.title }}
                  </h3>
                  <p> {{ children.length }} episodes </p>

                  <v-divider />

                  <p
                    style="font-style: italic"
                    class="pt-3; overflow: hidden"
                  >
                    {{ metadata.summary }}
                  </p>

                  <div>
                    <div
                      style="float:right"
                      class="pa-4"
                    >
                      <v-chip
                        v-if="metadata.grandparentContentRating"
                        label
                        color="grey"
                      >
                        {{ metadata.grandparentContentRating }}
                      </v-chip>

                      <v-chip
                        v-if="metadata.grandparentStudio"
                        secondary
                        color="grey"
                      >
                        {{ metadata.grandparentStudio }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>

    <h4 class="mt-3">
      Episodes
    </h4>

    <v-divider />

    <v-row
      class="row mt-3"
    >
      <v-col
        v-for="content in children"
        :key="content.key"
        cols="6"
        md="2"
        class="pb-3"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
          type="thumb"
          style="margin:2%"
          full-title
          @contentSet="setContent(content)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import sizing from '@/mixins/sizing';

export default {
  components: {
    plexthumb: () => import('./plexthumb.vue'),
  },

  mixins: [
    sizing,
  ],

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
      children: [],
      metadata: null,
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
    ]),

    getArtUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.metadata.banner,
        width: this.getAppWidth() / 2,
        height: this.getAppHeight(),
        blur: 2,
      });
    },

    getThumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.metadata.thumb
        || this.metadata.grandparentThumb
        || this.metadata.parentThumb,
        width: this.getAppWidth(),
        height: this.getAppHeight() / 2,
      });
    },
  },

  watch: {
    browsingContent() {
      if (!this.browsingContent) {
        this.$store.commit('SET_BACKGROUND', null);
      }
    },
  },

  async mounted() {
    await Promise.all([
      this.fetchMetadata(),
      this.fetchChildren(),
    ]);
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_PLEX_METADATA',
      'FETCH_MEDIA_CHILDREN',
    ]),

    async fetchMetadata() {
      this.metadata = await this.FETCH_PLEX_METADATA({
        ratingKey: this.ratingKey,
        machineIdentifier: this.machineIdentifier,
      });

      this.setBackground();
    },

    async fetchChildren() {
      this.children = await this.FETCH_MEDIA_CHILDREN({
        machineIdentifier: this.machineIdentifier,
        ratingKey: this.ratingKey,
        start: 0,
        size: 500,
        excludeAllLeaves: 1,
      });
    },

    setContent(content) {
      this.browsingContent = content;
    },

    setBackground() {
      this.$store.commit('SET_BACKGROUND',
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.metadata.art,
          width: this.getAppWidth() / 4,
          height: this.getAppHeight() / 4,
          blur: 2,
        }));
    },
  },
};
</script>
