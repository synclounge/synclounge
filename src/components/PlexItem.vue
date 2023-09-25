<template>
  <PlexMediaLayout
    :machine-identifier="metadata.machineIdentifier"
    :art="metadata.banner || metadata.art"
    :thumb="thumb"
    :title="title"
    :secondary-title="secondaryTitle"
    :subtitle="subtitle"
    :secondary-subtitle="secondarySubtitle"
    :children-header="childrenHeader"
    :children="children"
    child-full-title
    :child-cols="childCols"
    :child-sm="childSm"
    :child-md="childMd"
    :child-xl="childXl"
  >
    <template #belowImage>
      <template v-if="isPlaying">
        <v-row style="max-width: 200px;">
          <v-col
            cols="auto"
            class="text--secondary text-subtitle-2"
          >
            Now playing on {{ GET_CHOSEN_CLIENT.name }} from {{ server.name }}
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-btn
              block
              color="error"
              @click="PRESS_STOP"
            >
              <v-icon>stop</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <v-btn
          v-if="!AM_I_HOST"
          color="blue"
          @click="MANUAL_SYNC"
        >
          Manual sync
        </v-btn>
      </template>

      <template v-else>
        <v-col>
          <PlexMediaPlayDialog
            v-if="metadata.Media.length > 1 || metadata.viewOffset"
            v-slot="{ on, attrs }"
            :key="combinedKey"
            :metadata="metadata"
          >
            <v-btn
              v-bind="attrs"
              block
              class="primary"
              v-on="on"
            >
              <v-icon>play_arrow</v-icon>
            </v-btn>
          </PlexMediaPlayDialog>

          <v-btn
            v-else
            block
            class="primary"
            @click="playMedia(metadata, 0, 0)"
          >
            <v-icon>play_arrow</v-icon>
          </v-btn>
        </v-col>
      </template>
    </template>

    <template #postTitle>
      <v-col
        cols="auto"
        class="ml-auto"
      >
        <v-chip
          v-if="
            metadata.Media && metadata.Media[0] && metadata.Media[0].videoResolution
          "
          bottom
          outlined
          left
          class="mr-2"
        >
          {{ metadata.Media[0].videoResolution.toUpperCase() }}
        </v-chip>

        <v-chip
          v-if="metadata.contentRating"
          color="grey darken-2"
          small
          label
          class="mr-2"
        >
          {{ metadata.contentRating }}
        </v-chip>

        <v-chip
          v-if="metadata.studio"
          color="grey darken-2"
          small
          label
        >
          {{ metadata.studio }}
        </v-chip>
      </v-col>

      <v-col
        cols="auto"
        class="ml-auto"
      >
        <v-menu>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>more_vert</v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="markWatched">
              <v-list-item-title>Mark as played</v-list-item-title>
            </v-list-item>

            <v-list-item
              :href="
                'https://app.plex.tv/desktop#!/server/'
                  + metadata.machineIdentifier
                  + '/details?key='
                  + metadata.key
              "
              target="_blank"
            >
              <v-list-item-title>Open in Plex Web</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </template>

    <template #content>
      <v-row
        v-if="metadata.summary"
        class="text--primary text-body-2"
      >
        <v-col>
          <SpoilerText
            :key="combinedKey"
            :hide="!metadata.viewCount"
          >
            {{ metadata.summary }}
          </SpoilerText>
        </v-col>
      </v-row>

      <v-row
        v-if="metadata.type === 'movie'"
        class="hidden-sm-and-down"
        justify="start"
        align="start"
      >
        <v-col
          v-if="metadata.Role && metadata.Role.length"
          cols="auto"
        >
          <v-subheader>Featuring</v-subheader>

          <div
            v-for="actor in metadata.Role.slice(0, 6)"
            :key="actor.tag"
          >
            {{ actor.tag }}
            <span class="text--secondary text-caption"> {{ actor.role }} </span>
          </div>
        </v-col>

        <v-col
          v-if="metadata.Director && metadata.Director.length"
          cols="auto"
        >
          <v-subheader>Director</v-subheader>

          <div
            v-for="director in metadata.Director.slice(0, 3)"
            :key="director.tag"
          >
            {{ director.tag }}
          </div>
        </v-col>

        <v-col
          v-if="metadata.Producer && metadata.Producer.length"
          cols="auto"
        >
          <v-subheader>Producers</v-subheader>

          <div
            v-for="producer in metadata.Producer.slice(0, 3)"
            :key="producer.tag"
          >
            {{ producer.tag }}
          </div>
        </v-col>

        <v-col
          v-if="metadata.Writer && metadata.Writer.length"
          cols="auto"
        >
          <v-subheader>Writers</v-subheader>

          <div
            v-for="writer in metadata.Writer.slice(0, 3)"
            :key="writer.tag"
          >
            {{ writer.tag }}
          </div>
        </v-col>
      </v-row>
    </template>
  </PlexMediaLayout>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import duration from '@/mixins/duration';
import playMedia from '@/mixins/playmedia';

export default {
  name: 'PlexItem',

  components: {
    PlexMediaLayout: () => import('@/components/PlexMediaLayout.vue'),
    SpoilerText: () => import('@/components/SpoilerText.vue'),
    PlexMediaPlayDialog: () => import('@/components/PlexMediaPlayDialog.vue'),
  },

  mixins: [
    duration,
    playMedia,
  ],

  props: {
    metadata: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    dialog: false,
    children: [],
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT',
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_SERVER_ID',
      'GET_ACTIVE_MEDIA_METADATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    ...mapGetters('synclounge', [
      'AM_I_HOST',
    ]),

    // This exists so we can watch if either of these change
    combinedKey() {
      return `${this.metadata.machineIdentifier}${this.metadata.ratingKey}`;
    },

    thumb() {
      return this.metadata.type === 'movie'
        ? this.metadata.thumb
        : this.metadata.parentThumb || this.metadata.grandparentThumb;
    },

    title() {
      return this.metadata.type === 'episode'
        ? this.metadata.grandparentTitle
        : this.metadata.title;
    },

    secondaryTitle() {
      return this.metadata.type === 'episode'
        ? this.metadata.parentTitle
        : this.metadata.year.toString();
    },

    subtitle() {
      return this.metadata.type === 'episode'
        ? `Episode ${this.metadata.index} - ${this.metadata.title}`
        : '';
    },

    secondarySubtitle() {
      return this.getDuration(this.metadata.duration);
    },

    childrenHeader() {
      return this.metadata.type === 'episode'
        ? `Also in ${this.metadata.parentTitle} of ${this.metadata.grandparentTitle}`
        : 'Related Movies';
    },

    childCols() {
      return this.metadata.type === 'episode'
        ? 6
        : 4;
    },

    childSm() {
      return this.metadata.type === 'episode'
        ? 4
        : 3;
    },

    childMd() {
      return this.metadata.type === 'episode'
        ? 3
        : 2;
    },

    childXl() {
      return this.metadata.type === 'episode'
        ? 2
        : 1;
    },

    server() {
      return this.GET_PLEX_SERVER(this.metadata.machineIdentifier);
    },

    isPlaying() {
      return this.GET_ACTIVE_MEDIA_METADATA?.machineIdentifier === this.metadata.machineIdentifier
      && this.GET_ACTIVE_MEDIA_METADATA?.ratingKey === this.metadata.ratingKey;
    },
  },

  watch: {
    combinedKey: {
      handler() {
        this.dialog = false;
        return this.fetchRelated();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexclients', [
      'PLAY_MEDIA',
      'PRESS_STOP',
    ]),

    ...mapActions('plexservers', [
      'FETCH_RELATED',
      'FETCH_MEDIA_CHILDREN',
      'MARK_WATCHED',
    ]),

    ...mapActions('synclounge', [
      'MANUAL_SYNC',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    async fetchRelatedCriticalSection(signal) {
      if (this.metadata.type === 'episode') {
        this.children = await this.FETCH_MEDIA_CHILDREN({
          machineIdentifier: this.metadata.machineIdentifier,
          ratingKey: this.metadata.parentRatingKey,
          start: this.metadata.index - 1,
          size: 6,
          excludeAllLeaves: 1,
          signal,
        });
      } else if (this.metadata.type === 'movie') {
        this.children = await this.FETCH_RELATED({
          machineIdentifier: this.metadata.machineIdentifier,
          ratingKey: this.metadata.ratingKey,
          count: 12,
          signal,
        });
      }
    },

    async fetchRelated() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchRelatedCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },

    markWatched() {
      return this.MARK_WATCHED({
        machineIdentifier: this.metadata.machineIdentifier,
        ratingKey: this.metadata.ratingKey,
      });
    },
  },
};
</script>
