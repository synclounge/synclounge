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
    fluid
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
                <h1> {{ metadata.title1 }}</h1>

                <h3 style="font-weight:bold">
                  {{ metadata.title2 }}
                </h3>

                <p> {{ metadata.Metadata.length }} episodes </p>

                <v-divider />

                <p
                  style="overflow: hidden"
                  class="pt-3 font-italic"
                >
                  {{ metadata.summary }}
                </p>

                <div>
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
        v-for="content in metadata.Metadata"
        :key="content.key"
        cols="6"
        md="2"
        class="pb-3"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
          type="thumb"
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

    ratingKey: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      browsingContent: null,
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
    await this.fetchMetadata();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_SHOW',
    ]),

    async fetchMetadata() {
      this.metadata = await this.FETCH_SHOW({
        machineIdentifier: this.machineIdentifier,
        ratingKey: this.ratingKey,
        start: 0,
        size: 500,
        excludeAllLeaves: 1,
      });

      this.setBackground();
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
