<template>
  <v-container
    fluid
  >
    <v-row>
      <v-col
        v-for="content in contents"
        :key="content.ratingKey"
        cols="4"
        sm="3"
        md="2"
        xl="1"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
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
      justify="center"
      align="start"
    >
      <v-col
        v-intersect="onIntersect"
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
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  components: {
    plexthumb: () => import('@/components/plex/plexthumb.vue'),
  },

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

  data() {
    return {
      startingIndex: 0,
      size: 100,

      stopNewContent: false,
      busy: false,
      contents: [],
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),
  },

  created() {
    this.setupCrumbs();
    this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({
      machineIdentifier: this.machineIdentifier,
      sectionId: this.sectionId,
    });
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_LIBRARY_CONTENTS',
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async setupCrumbs() {
      const library = this.GET_PLEX_SERVER(this.machineIdentifier)
        .libraries[this.sectionId.toString()];

      this.SET_ACTIVE_METADATA({
        machineIdentifier: this.machineIdentifier,
        librarySectionID: this.sectionId,
        librarySectionTitle: library.title,
      });
    },

    async onIntersect(entries, observer, isIntersecting) {
      if (isIntersecting) {
        await this.fetchMoreContent();
      }
    },

    async fetchMoreContent() {
      if (this.stopNewContent || this.busy) {
        return;
      }

      this.busy = true;

      const results = await this.FETCH_LIBRARY_CONTENTS({
        machineIdentifier: this.machineIdentifier,
        sectionId: this.sectionId,
        start: this.startingIndex,
        size: this.size,
      });

      results.forEach((result) => {
        this.contents.push(result);
      });

      this.startingIndex += results.length;

      if (results.length < 100) {
        this.stopNewContent = true;
      }

      this.busy = false;
    },
  },
};
</script>
