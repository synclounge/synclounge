<template>
  <v-row
    v-if="!metadata"
  >
    <v-col
      cols="12"
      style="position: relative;"
    >
      <v-progress-circular
        style="left: 50%; top: 50%;"
        :size="60"
        indeterminate
        class="amber--text"
      />
    </v-col>
  </v-row>

  <v-container v-else>
    <v-row>
      <v-col cols="12">
        <v-card
          class="darken-2 white--text"
          :img="getArtUrl"
        >
          <v-container
            style="background: rgba(0, 0, 0, 0.6);"
            class="pa-3 ma-0"
            fluid
          >
            <v-row>
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
              >
                <h1> {{ metadata.title1 }}</h1>

                <h3> {{ metadata.title2 }} </h3>

                <p> {{ metadata.Metadata.length }} episodes </p>

                <v-divider />

                <p
                  style="overflow: hidden;"
                  class="pt-3 font-italic"
                >
                  {{ metadata.summary }}
                </p>

                <div>
                  <v-chip
                    v-if="metadata.grandparentContentRating"
                    class="mr-2"
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

    <v-subheader>Episodes</v-subheader>

    <v-row>
      <v-col
        v-for="content in metadata.Metadata"
        :key="content.key"
        cols="6"
        sm="4"
        md="3"
        xl="2"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
          full-title
          type="thumb"
          cols="6"
          sm="4"
          md="3"
          xl="2"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { getAppWidth, getAppHeight } from '@/utils/sizing';

export default {
  components: {
    plexthumb: () => import('@/components/plex/plexthumb.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },

    ratingKey: {
      type: [Number, String],
      required: true,
    },
  },

  data() {
    return {
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
        width: getAppWidth(),
        height: getAppHeight(),
        blur: 2,
      });
    },

    getThumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.metadata.thumb
        || this.metadata.grandparentThumb
        || this.metadata.parentThumb,
        width: getAppWidth(),
        height: getAppHeight() / 2,
      });
    },
  },

  created() {
    this.fetchMetadata();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_CHILDREN_CONTAINER',
      'SET_MEDIA_AS_BACKGROUND',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async fetchMetadata() {
      this.metadata = await this.FETCH_CHILDREN_CONTAINER({
        machineIdentifier: this.machineIdentifier,
        ratingKey: this.ratingKey,
        start: 0,
        size: 500,
        excludeAllLeaves: 1,
      });

      // Plex gives us some weird metadata and we need to clean it up for crumbs
      const { grandparentTitle, grandparentRatingKey, ...otherMetadata } = this.metadata;
      this.SET_ACTIVE_METADATA({
        machineIdentifier: this.machineIdentifier,
        ...otherMetadata,
        parentTitle: grandparentTitle,
        parentRatingKey: grandparentRatingKey,
        title: this.metadata.title2,
        ratingKey: this.ratingKey,
        type: 'season',
      });

      await this.SET_MEDIA_AS_BACKGROUND({
        machineIdentifier: this.machineIdentifier,
        ...this.metadata,
      });
    },
  },
};
</script>
