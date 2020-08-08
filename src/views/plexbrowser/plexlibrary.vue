<template>
  <v-container
    fluid
  >
    <v-row
      v-if="!browsingContent"
    >
      <v-col
        v-for="content in contents"
        :key="content.ratingKey"
        cols="3"
        md="1"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
          type="thumb"
          @contentSet="setContent(content)"
        />
      </v-col>
    </v-row>

    <v-row
      v-if="!browsingContent && !stopNewContent"
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
import { sample } from '@/utils/lightlodash';
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

    sectionId: {
      type: [String, Number],
      required: true,
    },
  },

  data() {
    return {
      browsingContent: null,
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
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_ALL_LIBRARIES_IF_NEEDED',
      'FETCH_LIBRARY_CONTENTS',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async setupCrumbs() {
      await this.FETCH_ALL_LIBRARIES_IF_NEEDED({ machineIdentifier: this.machineIdentifier });

      const library = this.GET_PLEX_SERVER(this.machineIdentifier).libraries
        .find((lib) => lib.key === this.sectionId.toString());

      this.SET_ACTIVE_METADATA({
        machineIdentifier: this.machineIdentifier,
        librarySectionID: this.sectionId,
        librarySectionTitle: library.title,
      });
    },

    setContent(content) {
      this.browsingContent = content;
    },

    setBackground() {
      const randomItem = sample(this.contents);

      this.$store.commit('SET_BACKGROUND',
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: randomItem.type === 'show'
            ? randomItem.art
            : randomItem.thumb,
          width: getAppWidth() / 4,
          height: getAppHeight() / 4,
          blur: 8,
        }));
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

      if (this.contents.length <= 100 && this.contents.length > 0) {
        // First time we got content
        this.setBackground();
      }

      if (results.length < 100) {
        this.stopNewContent = true;
      }

      this.busy = false;
    },
  },
};
</script>
