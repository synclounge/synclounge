<template>
  <v-container
    fluid
    style=" overflow-y: auto"
  >
    <v-row
      v-if="!contents && !browsingContent"
      justify="center"
      align="start"
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

    <v-row
      v-if="!browsingContent && contents"
      no-gutter
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

    <v-row>
      <v-col
        v-if="contents && !browsingContent && !stopNewContent"
        v-observe-visibility="getMoreContent"
        cols="12"
        justify="center"
      >
        Loading...
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { sample } from 'lodash-es';

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
    ]),
  },

  created() {
    console.log('created');
    this.getMoreContent();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_LIBRARY_CONTENTS',
    ]),

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
          width: this.getAppWidth() / 4,
          height: this.getAppHeight() / 4,
          blur: 8,
        }));
    },

    async getMoreContent() {
      console.log('get more content');
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
