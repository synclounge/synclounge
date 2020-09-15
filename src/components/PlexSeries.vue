<template>
  <PlexMediaLayout
    :machine-identifier="metadata.machineIdentifier"
    :art="metadata.banner || metadata.art"
    :thumb="metadata.thumb"
    :title="metadata.title"
    :secondary-title="secondaryTitle"
    children-header="Seasons"
    :children="children"
    child-cols="4"
    child-sm="3"
    child-md="2"
    child-xl="1"
  >
    <template #content>
      <v-row>
        <v-col>
          <v-chip
            v-for="genre in genres"
            :key="genre.tag"
            label
            class="mr-2"
            color="grey"
          >
            {{ genre.tag }}
          </v-chip>
        </v-col>

        <v-spacer />

        <v-col cols="auto">
          <v-chip
            v-if="metadata.contentRating"
            class="mr-2"
            label
            color="grey"
          >
            {{ metadata.contentRating }}
          </v-chip>

          <v-chip
            v-if="metadata.studio"
            secondary
            color="grey"
          >
            {{ metadata.studio }}
          </v-chip>
        </v-col>
      </v-row>

      <v-row
        v-if="metadata.summary"
        class="text--primary text-body-2"
      >
        <v-col>
          {{ metadata.summary }}
        </v-col>
      </v-row>

      <template v-if="roles.length">
        <v-subheader>Featuring</v-subheader>

        <v-row>
          <v-col
            v-for="(role, index) in roles"
            :key="index"
            cols="12"
            md="6"
            lg="4"
          >
            <v-chip>
              <v-avatar left>
                <v-img
                  :src="makeHttpsUrl(role.thumb)"
                />
              </v-avatar>
              {{ role.tag }}

              <div
                class="pa-2 text--secondary text-caption"
              >
                {{ role.role }}
              </div>
            </v-chip>
          </v-col>
        </v-row>
      </template>
    </template>
  </PlexMediaLayout>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'PlexSeries',

  components: {
    PlexMediaLayout: () => import('@/components/PlexMediaLayout.vue'),
  },

  props: {
    metadata: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    children: [],
    abortController: null,
  }),

  computed: {
    // This exists so we can watch if either of these change
    combinedKey() {
      return {
        machineIdentifier: this.metadata.machineIdentifier,
        ratingKey: this.metadata.ratingKey,
      };
    },

    secondaryTitle() {
      return `${this.seasons} - ${this.metadata.year}`;
    },

    seasons() {
      const seasonWord = this.children.length === 1
        ? 'season'
        : 'seasons';

      return `${this.children.length} ${seasonWord}`;
    },

    roles() {
      return this.metadata.Role?.slice(0, 6) || [];
    },

    genres() {
      return this.metadata.Genre?.slice(0, 5) || [];
    },
  },

  watch: {
    combinedKey: {
      handler() {
        return this.fetchChildren();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_MEDIA_CHILDREN',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    makeHttpsUrl(urlIn) {
      try {
        const url = new URL(urlIn);
        url.protocol = 'https:';
        return url.toString();
      } catch (e) {
        console.warn(e);
        return '';
      }
    },

    async fetchChildrenCriticalSection(signal) {
      this.children = await this.FETCH_MEDIA_CHILDREN({
        machineIdentifier: this.metadata.machineIdentifier,
        ratingKey: this.metadata.ratingKey,
        start: 0,
        size: 150,
        excludeAllLeaves: 1,
        signal,
      });
    },

    async fetchChildren() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchChildrenCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
