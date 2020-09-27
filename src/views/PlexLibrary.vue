<template>
  <v-container
    :style="containerStyle"
    fluid
  >
    <v-row
      v-if="IS_LIBRARY_LIST_VIEW"
      no-gutters
      class="ma-n3"
    >
      <v-col>
        <v-data-table
          fixed-header
          hide-default-footer
          :headers="headers[library.type]"
          :items="contents"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :items-per-page.sync="itemsPerPage"
          :server-items-length="totalItems"
          :loading="childrenAbortController != null"
          item-key="ratingKey"
          :must-sort="true"
          style="cursor: pointer;"
          @click:row="onRowClick"
        >
          <template v-slot:item.duration="{ item }">
            {{ getDuration(item.duration) }}
          </template>

          <template v-slot:item.viewedLeafCount="{ item }">
            {{ item.leafCount - item.viewedLeafCount }} unplayed
          </template>

          <template v-slot:item.viewOffset="{ item }">
            <span v-if="item.viewOffset">
              {{ getDuration(item.duration - item.viewOffset) }} left
            </span>

            <v-chip
              v-else
              color="yellow"
              pill
              class="pa-2"
              style="height: auto;"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="content in contents"
        :key="content.ratingKey"
        cols="4"
        sm="3"
        md="2"
        xl="1"
      >
        <PlexThumbnail
          :content="content"
          type="thumb"
          cols="4"
          sm="3"
          md="2"
          xl="1"
        />
      </v-col>
    </v-row>

    <v-row
      v-if="!stopNewContent"
      v-intersect="onIntersect"
    />
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { intervalToDuration } from 'date-fns';
import contentLink from '@/mixins/contentlink';

export default {
  name: 'PlexLibrary',

  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  mixins: [
    contentLink,
  ],

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },

    sectionId: {
      type: [String, Number],
      required: true,
    },
  },

  data: () => ({
    batchSize: 50,
    stopNewContent: false,
    contents: [],
    itemsPerPage: 0,
    sortBy: [],
    sortDesc: [],
    backgroundAbortController: null,
    childrenAbortController: null,

    headers: {
      show: [
        { text: 'Title', value: 'title' },
        { text: 'Year', value: 'year' },
        { text: 'Unplayed', value: 'viewedLeafCount' },
      ],

      movie: [
        { text: 'Title', value: 'title' },
        { text: 'Year', value: 'year' },
        { text: 'Duration', value: 'duration' },
        { text: 'Progress', value: 'viewOffset' },
      ],
    },
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
      'GET_SERVER_LIBRARY_SIZE',
    ]),

    ...mapGetters([
      'IS_LIBRARY_LIST_VIEW',
    ]),

    // This exists so we can watch if either of these change
    combinedKey() {
      return {
        machineIdentifier: this.machineIdentifier,
        sectionId: this.sectionId,
      };
    },

    // This exists so we can watch if the sort changes
    combinedSortKey() {
      return {
        sortBy: this.sortBy,
        sortDesc: this.sortDesc,
      };
    },

    containerStyle() {
      return this.IS_LIBRARY_LIST_VIEW
        ? {
          'max-width': 'none',
          padding: 0,
        }
        : null;
    },

    sortParam() {
      if (this.sortBy.length > 0 && this.sortDesc.length > 0) {
        const sortField = this.sortBy[0] === 'viewedLeafCount'
          ? 'unviewedLeafCount'
          : this.sortBy[0];
        const isDesc = this.sortDesc[0];

        const sortOption = isDesc
          ? ':desc'
          : '';

        return `${sortField}${sortOption}`;
      }

      return '';
    },

    library() {
      return this.GET_PLEX_SERVER(this.machineIdentifier)
        .libraries[this.sectionId.toString()];
    },

    totalItems() {
      return this.GET_SERVER_LIBRARY_SIZE({
        machineIdentifier: this.machineIdentifier,
        sectionId: this.sectionId,
      });
    },
  },

  watch: {
    combinedKey: {
      handler() {
        this.stopNewContent = false;
        this.contents = [];
        this.itemsPerPage = 0;
        this.setupCrumbs();
        return this.fetchRandomBackground();
      },
      immediate: true,
    },

    combinedSortKey: {
      handler() {
        return this.onSortChange();
      },
      deep: true,
    },

    IS_LIBRARY_LIST_VIEW() {
      this.stopNewContent = false;
      this.contents = [];
      this.itemsPerPage = 0;
      this.sortBy = [];
      this.sortDesc = [];
      this.abortChildrenRequests();
    },
  },

  beforeDestroy() {
    this.abortBackgroundRequests();
    this.abortChildrenRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_LIBRARY_CONTENTS',
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    getDuration(end) {
      const duration = intervalToDuration({ start: 0, end });

      const hourPart = duration.hours > 0
        ? `${duration.hours} hr`
        : null;

      const minutePart = duration.minutes > 0
        ? `${duration.minutes} min`
        : null;

      const parts = [
        hourPart,
        minutePart,
      ];

      return parts.filter((part) => part).join(' ');
    },

    setupCrumbs() {
      this.SET_ACTIVE_METADATA({
        machineIdentifier: this.machineIdentifier,
        librarySectionID: this.sectionId,
        librarySectionTitle: this.library.title,
      });
    },

    async onIntersect(entries, observer, isIntersecting) {
      if (isIntersecting && !this.childrenAbortController) {
        await this.fetchMoreContent();
      }
    },

    onRowClick(item) {
      this.$router.push(this.contentLink(item));
    },

    abortBackgroundRequests() {
      if (this.backgroundAbortController) {
        // Cancel outstanding request
        this.backgroundAbortController.abort();
        this.backgroundAbortController = null;
      }
    },

    abortChildrenRequests() {
      if (this.childrenAbortController) {
        // Cancel outstanding request
        this.childrenAbortController.abort();
        this.childrenAbortController = null;
      }
    },

    async onSortChange() {
      this.abortChildrenRequests();

      this.stopNewContent = false;
      // Reset items
      this.contents = [];
      this.itemsPerPage = 0;
      await this.fetchMoreContent();
    },

    async fetchMoreContentCriticalSection(signal) {
      const results = await this.FETCH_LIBRARY_CONTENTS({
        machineIdentifier: this.machineIdentifier,
        sectionId: this.sectionId,
        start: this.itemsPerPage,
        size: this.batchSize,
        sort: this.sortParam,
        signal,
      });

      results.forEach((result) => {
        this.contents.push(result);
      });

      this.itemsPerPage += results.length;

      if (results.length < this.batchSize) {
        this.stopNewContent = true;
      }
    },

    async fetchMoreContent() {
      this.abortChildrenRequests();

      if (this.stopNewContent) {
        return;
      }

      const controller = new AbortController();
      this.childrenAbortController = controller;

      try {
        await this.fetchMoreContentCriticalSection(controller.signal);
        this.childrenAbortController = null;
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },

    async fetchRandomBackgroundCriticalSection(signal) {
      await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({
        machineIdentifier: this.machineIdentifier,
        sectionId: this.sectionId,
        signal,
      });
    },

    async fetchRandomBackground() {
      this.abortBackgroundRequests();

      const controller = new AbortController();
      this.backgroundAbortController = controller;

      try {
        await this.fetchRandomBackgroundCriticalSection(controller.signal);
        this.backgroundAbortController = null;
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>

<style scoped>
.v-data-table--fixed-header /deep/ > .v-data-table__wrapper > table > thead > tr > th {
  top: -12px;
}

.v-data-table /deep/ .v-data-table__wrapper {
  overflow: unset;
}
</style>
