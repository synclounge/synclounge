<template>
  <div v-if="metadata">
    <PlexSeries
      v-if="metadata.type === 'series' || metadata.type === 'show'"
      :metadata="metadata"
    />

    <PlexSeason
      v-else-if="metadata.type === 'season'"
      :metadata="metadata"
    />

    <PlexItem
      v-else
      :metadata="metadata"
    />
  </div>

  <v-row
    v-else
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
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  name: 'PlexMedia',

  components: {
    PlexItem: () => import('@/components/PlexItem.vue'),
    PlexSeason: () => import('@/components/PlexSeason.vue'),
    PlexSeries: () => import('@/components/PlexSeries.vue'),
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

    // This exists so we can watch if either of these change
    combinedKey() {
      return {
        machineIdentifier: this.machineIdentifier,
        ratingKey: this.ratingKey,
      };
    },
  },

  watch: {
    combinedKey: {
      handler() {
        this.fetchMetadata();
      },
      immediate: true,
    },
  },

  methods: {
    ...mapActions('plexservers', [
      'SET_MEDIA_AS_BACKGROUND',
      'FETCH_PLEX_METADATA',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async fetchMetadata() {
      this.metadata = await this.FETCH_PLEX_METADATA({
        ratingKey: this.ratingKey,
        machineIdentifier: this.machineIdentifier,
      });

      this.SET_ACTIVE_METADATA(this.metadata);

      await this.SET_MEDIA_AS_BACKGROUND({
        machineIdentifier: this.machineIdentifier,
        ...this.metadata,
      });
    },
  },
};
</script>
