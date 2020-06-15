<template>
  <v-container
    class="slcontent"
  >
    <v-row
      v-if="!contents"
      row
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


    <v-card
      v-if="contents"
      horizontal
      :img="getArtUrl"
      style="height: 80vh"
      class="darken-2 white--text"
    >
      <div style=" height: 100%">
        <v-container
          style="background-color: rgba(0, 0, 0, 0.8); height: 100%"
          fluid
        >
          <v-row>
            <v-col
              sm="12"
              md="3"
            >
              <v-row>
                <v-col
                  md="12"
                  class="pa-2"
                >
                  <v-img
                    :src="thumb"
                    height="30vh"
                    contain
                  />
                </v-col>

                <v-col
                  sm="8"
                  md="12"
                  class="text-center hidden-sm-and-down "
                >
                  <div v-if="playable">
                    <v-btn
                      v-if="
                        playable &&
                          contents.Media.length == 1 &&
                          (contents.viewOffset == 0 || !contents.viewOffset)
                      "
                      block
                      class="primary white--text"
                      @click.native="playMedia(contents, 0)"
                    >
                      <v-icon> play_arrow </v-icon>
                    </v-btn>

                    <v-btn
                      v-else
                      block
                      class="primary white--text"
                      @click.native.stop="dialog = true"
                    >
                      <v-icon> play_arrow </v-icon>
                    </v-btn>
                  </div>

                  <div
                    v-if="!playable"
                    class="pa-2"
                  >
                    Now playing on {{ GET_CHOSEN_CLIENT.name }} from {{ server.name }}
                  </div>

                  <v-btn
                    v-if="!playable"
                    style="background-color: #cc3f3f"
                    class="white--text"
                    @click.native="pressStop()"
                  >
                    <v-icon /> Stop
                  </v-btn>

                  <div v-if="!playable">
                    <v-btn
                      v-if="me.role !== 'host'"
                      :disabled="manualSyncQueued"
                      color="blue"
                      @click.native="doManualSync"
                    >
                      Manual sync
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-col>

            <v-col
              sm="12"
              md="9"
              class="pa-2"
            >
              <h1>
                {{ title }}
                <span style="float: right">
                  <v-menu>
                    <v-btn
                      icon
                      class="ma-0 pa-0"
                      dark
                    >
                      <v-icon>more_vert</v-icon>
                    </v-btn>

                    <v-list>
                      <v-list-item @click="markWatched(contents)">
                        <v-list-item-title>Mark as played</v-list-item-title>
                      </v-list-item>

                      <v-list-item
                        :href="
                          'https://app.plex.tv/desktop#!/server/' +
                            contents.machineIdentifier +
                            '/details?key=' +
                            contents.key
                        "
                        target="_blank"
                      >
                        <v-list-item-title>Open in Plex Web</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </span>
              </h1>

              <h4 v-if="contents.type === 'episode'">
                Season {{ contents.parentIndex }} Episode {{ contents.index }} ({{
                  contents.year
                }})
              </h4>

              <h2 v-if="contents.type === 'episode'">
                {{ contents.title }}
              </h2>

              <h3 v-else>
                {{ contents.year }}
              </h3>

              <v-row>
                <v-col
                  sm="12"
                  md="6"
                  style="opacity:0.5"
                >
                  {{ length }}
                </v-col>

                <v-col
                  sm="6"
                >
                  <div class="text-xs-right">
                    <v-chip
                      v-if="
                        contents.Media && contents.Media[0] && contents.Media[0].videoResolution
                      "
                      bottom
                      outlined
                      left
                    >
                      {{ contents.Media[0].videoResolution.toUpperCase() }}
                    </v-chip>

                    <v-chip
                      v-if="contents.contentRating"
                      color="grey darken-2"
                      small
                      label
                    >
                      {{ contents.contentRating }}
                    </v-chip>

                    <v-chip
                      v-if="contents.studio"
                      color="grey darken-2"
                      small
                      label
                    >
                      {{ contents.studio }}
                    </v-chip>
                  </div>
                </v-col>

                <v-col
                  cols="12"
                  class="text-center hidden-md-and-up "
                >
                  <div v-if="playable">
                    <v-btn
                      v-if="
                        playable &&
                          contents.Media.length == 1 &&
                          (contents.viewOffset == 0 || !contents.viewOffset)
                      "
                      block
                      class="primary white--text"
                      @click.native="playMedia(contents, 0)"
                    >
                      <v-icon> play_arrow </v-icon>
                    </v-btn>

                    <v-btn
                      v-else
                      block
                      class="primary white--text"
                      @click.native.stop="dialog = true"
                    >
                      <v-icon> play_arrow </v-icon>
                    </v-btn>
                  </div>

                  <div v-else>
                    <v-row>
                      <v-col cols="12">
                        <div class="pa-2">
                          Now playing on {{ GET_CHOSEN_CLIENT.name }} from {{ server.name }}
                        </div>
                      </v-col>

                      <v-col cols="12">
                        <v-btn
                          block
                          style="background-color: #cc3f3f"
                          class="white--text"
                          @click.native="pressStop()"
                        >
                          <v-icon /> Stop
                        </v-btn>
                      </v-col>

                      <v-col cols="12">
                        <v-btn
                          v-if="me.role !== 'host'"
                          block
                          :disabled="manualSyncQueued"
                          color="blue"
                          @click.native="doManualSync"
                        >
                          Manual sync
                        </v-btn>
                      </v-col>
                    </v-row>
                  </div>
                </v-col>

                <div style="width: 100%">
                  <p
                    v-if="hidden"
                    class="pt-3"
                    style="font-style: italic"
                    @click="hiddenOverride = true"
                  >
                    Summary automatically hidden for unwatched content. Click to unhide.
                  </p>

                  <p
                    v-else
                    class="pt-3"
                    style="font-style: italic"
                  >
                    {{ contents.summary }}
                  </p>
                </div>

                <v-row
                  v-if="contents.type === 'movie'"
                  class="hidden-sm-and-down"
                  justify="start"
                  align="start"
                >
                  <v-col
                    v-if="contents.Role && contents.Role.length > 0"
                    lg="3"
                    xl="2"
                  >
                    <v-subheader class="white--text">
                      Featuring
                    </v-subheader>

                    <div
                      v-for="actor in contents.Role.slice(0, 6)"
                      :key="actor.tag"
                    >
                      {{ actor.tag }}
                      <span style="opacity:0.7;font-size:80%"> {{ actor.role }} </span>
                    </div>
                  </v-col>

                  <v-col
                    v-if="contents.Director && contents.Director.length > 0"
                    lg="3"
                    xl="2"
                  >
                    <v-subheader class="white--text">
                      Director
                    </v-subheader>

                    <div
                      v-for="director in contents.Director.slice(0, 3)"
                      :key="director.tag"
                    >
                      {{ director.tag }}
                    </div>
                  </v-col>

                  <v-col
                    v-if="contents.Producer && contents.Producer.length > 0"
                    lg="3"
                    xl="2"
                  >
                    <v-subheader class="white--text">
                      Producers
                    </v-subheader>

                    <div
                      v-for="producer in contents.Producer.slice(0, 3)"
                      :key="producer.tag"
                    >
                      {{ producer.tag }}
                    </div>
                  </v-col>

                  <v-col
                    v-if="contents.Writer && contents.Writer.length > 0"
                    lg="3"
                    xl="2"
                  >
                    <v-subheader class="white--text">
                      Writers
                    </v-subheader>

                    <div
                      v-for="writer in contents.Writer.slice(0, 3)"
                      :key="writer.tag"
                    >
                      {{ writer.tag }}
                    </div>
                  </v-col>
                </v-row>
              </v-row>
            </v-col>
          </v-row>

          <v-divider />

          <div
            v-if="subsetParentData.length >= 0 && contents.type == 'episode'"
            class="hidden-xs-only"
          >
            <v-subheader>
              Also in Season {{ contents.parentIndex }} of
              {{ contents.grandparentTitle }}
            </v-subheader>

            <v-row
              v-if="parentData"
              justify="start"
            >
              <v-col
                v-for="ep in subsetParentData"
                :key="ep.key"
                sm="6"
                md="2"
                class="pb-3"
              >
                <plexthumb
                  bottom-only
                  :content="ep"
                  :img="getLittleThumb(ep)"
                  :class="{ highlightBorder: ep.index === contents.index }"
                  style="margin:3%"
                  :server-id="machineIdentifier"
                  spoiler-filter
                />
              </v-col>
            </v-row>
          </div>

          <div v-if="related.length > 0">
            <v-subheader>Related Movies</v-subheader>
            <v-container
              fill-height
              fluid
            >
              <v-row
                justify="space-around"
                align="center"
              >
                <v-col
                  v-for="movie in related"
                  :key="movie.key"
                  sm="4"
                  md="1"
                  class="ma-1"
                >
                  <plexthumb
                    :content="movie"
                    :img="getLittleThumb(movie)"
                    style="margin:3%"
                    :server-id="machineIdentifier"
                    type="thumb"
                  />
                </v-col>
              </v-row>
            </v-container>
          </div>
        </v-container>
      </div>
    </v-card>

    <v-dialog
      v-if="contents"
      v-model="dialog"
      style="background: rgba(0,0,0,0.95); box-shadow: none !important"
      width="500px"
    >
      <v-card style="overflow: hidden">
        <v-card-title class="headline">
          Playback Settings
        </v-card-title>

        <v-checkbox
          v-if="contents.viewOffset && contents.viewOffset > 0"
          v-model="resumeFrom"
          :label="'Resume from ' + getDuration(contents.viewOffset)"
          color="orange lighten-2"
          class="pa-0 ma-0 ml-3"
        />

        <div
          v-for="(media, index) in contents.Media"
          :key="media.Part[0].key"
        >
          <v-row
            class="pa-2"
          >
            <v-col cols="8">
              <div class="pl-2">
                {{ media.videoResolution }}p {{ getDuration(media.duration) }}
              </div>

              <div class="pl-4 soft-text">
                <div>Video Codec: {{ media.videoCodec }} ({{ media.bitrate }}kbps)</div>
                <div>Audio Streams: {{ audioStreams(media.Part[0].Stream) }}</div>
                <div>Subtitles: {{ subtitleStreams(media.Part[0].Stream) }}</div>
              </div>
            </v-col>

            <v-col cols="4">
              <v-btn
                class="primary white--text"
                @click.native.stop="playMedia(contents, index)"
              >
                Play
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import humanizeDuration from 'humanize-duration';

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
      resumeFrom: true,

      contents: null,
      status: 'loading..',
      dialog: false,
      related: [],

      parentData: null,

      hiddenOverride: false,
    };
  },

  computed: {
    ...mapGetters([
      'GET_CHOSEN_CLIENT',

    ]),

    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    me() {
      return this.$store.state.me;
    },

    manualSyncQueued() {
      return this.$store.state.manualSyncQueued;
    },

    hidden() {
      if (this.hiddenOverride) {
        return false;
      }

      if ((this.contents && this.contents.viewCount === 0) || !this.contents.viewCount) {
        return true;
      }

      return false;
    },

    playable() {
      return this.$route.fullPath.indexOf('/nowplaying') === -1;
    },

    getArtUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.contents.type === 'movie'
          ? this.contents.art
          : this.contents.grandparentArt,
        width: this.getAppWidth() * 1.5,
        height: this.getAppHeight() * 1.5,
        blur: 0,
      });
    },

    length() {
      return humanizeDuration(this.contents.duration, {
        delimiter: ' ',
        units: ['h', 'm'],
        round: true,
      });
    },

    title() {
      return this.contents.type === 'episode'
        ? this.contents.grandparentTitle
        : this.contents.title;
    },

    thumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.contents.type === 'movie'
          ? this.contents.thumb
          : this.contents.parentThumb || this.contents.grandparentThumb,
        width: this.getAppWidth(),
        height: this.getAppHeight(),
      });
    },

    subsetParentData() {
      const size = 6;
      if (!this.parentData) {
        return [];
      }
      return this.parentData.slice(
        this.contents.index - 1,
        this.contents.index + size - 1,
      );
    },
  },

  watch: {
    ratingKey() {
      this.getNewData();
    },
  },

  mounted() {
    this.getNewData();
  },

  methods: {
    ...mapActions('plexclients', [
      'PLEX_CLIENT_PLAY_MEDIA',
    ]),

    ...mapActions('plexservers', [
      'FETCH_PLEX_METADATA',
      'FETCH_RELATED',
      'FETCH_MEDIA_CHILDREN',
    ]),

    ...mapMutations([
      'SET_BACKGROUND',
    ]),

    async getNewData() {
      this.contents = await this.FETCH_PLEX_METADATA({
        key: `/library/metadata/${this.ratingKey}`,
        machineIdentifier: this.machineIdentifier,
      });


      if (this.contents.type === 'episode') {
        this.parentData = await this.FETCH_MEDIA_CHILDREN({
          machineIdentifier: this.machineIdentifier,
          key: this.contents.parentKey,
          start: 0,
          size: 500,
          excludeAllLeaves: 1,
        });
      } else if (this.contents.type === 'movie') {
        this.related = await this.FETCH_RELATED({
          machineIdentifier: this.machineIdentifier,
          key: `/library/metadata/${this.ratingKey}`,
          count: 7,
        });
      }
      this.setBackground();
    },

    setContent(content) {
      this.$router.push(`/browse/${this.serverId}/${content.ratingKey}`);
    },

    doManualSync() {
      this.$store.commit('SET_VALUE', ['manualSyncQueued', true]);
    },

    getLittleThumb(content) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: content.thumb,
        width: this.getAppWidth() / 2,
        height: this.getAppHeight() / 2,
        blur: 0,
      });
    },

    setBackground() {
      this.SET_BACKGROUND(
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.contents.art,
          width: this.getAppWidth() / 4,
          height: this.getAppHeight() / 4,
          blur: 2,
        }),
      );
    },

    markWatched() {
      this.server.markWatchedByRatingKey(this.contents.ratingKey, () => {
        this.$parent.reset();
      });
    },

    async playMedia(content, mediaIndex) {
      let offset = 0;
      if (this.resumeFrom) {
        offset = this.contents.viewOffset;
      }

      await this.PLEX_CLIENT_PLAY_MEDIA({
        key: this.contents.key,
        mediaIndex,
        serverIdentifier: this.$route.params.machineIdentifier,
        offset,
      });
      this.dialog = false;
    },

    getDuration(dur) {
      return humanizeDuration(dur, {
        delimiter: ' ',
        units: ['h', 'm', 's'],
        round: true,
      });
    },

    pressStop() {
      this.GET_CHOSEN_CLIENT.pressStop(() => {});
    },

    getStreamCount(streams, type) {
      let count = 0;
      streams.forEach((stream) => {
        if (stream.streamType === type) {
          count += 1;
        }
      });
      return count;
    },

    audioStreams(media) {
      let result = '';
      for (let i = 0; i < media.length; i += 1) {
        const stream = media[i];
        if (stream.streamType === 2) {
          result = `${result} ${stream.languageCode || 'Unknown Lanugage'},`;
        }
      }
      result = result.substring(0, result.length - 1);
      return result;
    },

    subtitleStreams(media) {
      let result = '';
      for (let i = 0; i < media.length; i += 1) {
        const stream = media[i];
        if (stream.streamType === 3) {
          result = `${result} ${stream.languageCode || 'Unknown Lanugage'},`;
        }
      }
      result = result.substring(0, result.length - 1);
      return result;
    },
  },
};
</script>

<style scoped>
.slcontent .dialog .dialog--active {
  box-shadow: none;
}
</style>
