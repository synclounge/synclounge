<template>
    <div ref="root" class="slcontent">
      <v-layout v-if="!contents" row>
        <v-flex xs12 style="position:relative">
          <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
        </v-flex>
      </v-layout>
      <div v-if="contents">
        <v-card v-if="contents" horizontal :img="getArtUrl" style="height: 80vh" class="darken-2 white--text">
          <div style=" height: 100%">
            <v-container style="background-color: rgba(0, 0, 0, 0.8); height: 100%" fluid>
              <v-layout row wrap>
                <v-flex xs12 md3>
                  <v-layout row wrap>
                    <v-flex md12 class="pa-2">
                      <v-card-media
                        :src="thumb"
                        height="30vh"
                        contain
                      ></v-card-media>
                    </v-flex>
                    <v-flex xs8 md12 class="text-xs-center hidden-sm-and-down ">
                      <div v-if="playable">
                        <v-btn block v-if="playable && contents.Media.length == 1 && (contents.viewOffset == 0 || !contents.viewOffset)"  v-on:click.native="playMedia(contents)" class="primary white--text">
                          <v-icon> play_arrow </v-icon>
                        </v-btn>
                        <v-btn block v-else @click.native.stop="dialog = true" class="primary white--text">
                          <v-icon> play_arrow </v-icon>
                        </v-btn>
                      </div>
                      <div v-if="!playable" class="pa-2">Now playing on {{ chosenClient.name }} from {{ server.name }}</div>
                      <v-btn v-if="!playable" style="background-color: #cc3f3f" v-on:click.native="pressStop()" class="white--text">
                        <v-icon></v-icon> Stop
                      </v-btn>
                      <div v-if="!playable">
                        <v-btn :disabled="manualSyncQueued" color="blue" v-on:click.native="doManualSync" v-if="me.role !== 'host'">Manual sync</v-btn>
                      </div>
                    </v-flex>
                  </v-layout>
                </v-flex>
                <v-flex xs12 md9 sm12 class="pa-2">
                  <h1>
                    {{ title }}
                    <span style="float: right">
                      <v-menu>
                        <v-btn icon slot="activator" class="ma-0 pa-0" dark>
                          <v-icon>more_vert</v-icon>
                        </v-btn>
                        <v-list>
                          <v-list-tile @click="markWatched(contents)">
                            <v-list-tile-title>Mark as played</v-list-tile-title>
                          </v-list-tile>
                          <v-list-tile :href="'https://app.plex.tv/desktop#!/server/' + contents.machineIdentifier + '/details?key=' + contents.key" target="_blank">
                            <v-list-tile-title>Open in Plex Web</v-list-tile-title>
                          </v-list-tile>
                        </v-list>
                      </v-menu>
                    </span>
                  </h1>
                  <h4 v-if="contents.type === 'episode'">  Season {{ contents.parentIndex }} Episode {{ contents.index }} ({{ contents.year }}) </h4>
                  <h2 v-if="contents.type === 'episode'">{{ contents.title }} </h2>
                  <h3 v-else>{{ contents.year }}</h3>
                  <v-layout row wrap>
                    <v-flex xs12 md6 style="opacity:0.5">
                      {{ length }}
                    </v-flex>
                    <v-flex xs12 sm6>
                      <div class="text-xs-right">
                        <v-chip v-if="contents.Media && contents.Media[0] && contents.Media[0].videoResolution" bottom  outline left> {{ contents.Media[0].videoResolution.toUpperCase() }}</v-chip>
                        <v-chip v-if="contents.contentRating" color="grey darken-2" small label> {{ contents.contentRating }}</v-chip>
                        <v-chip v-if="contents.studio" color="grey darken-2" small label> {{ contents.studio }}</v-chip>
                      </div>
                    </v-flex>
                    <v-flex xs12 class="text-xs-center hidden-md-and-up ">
                      <div v-if="playable">
                        <v-btn block v-if="playable && contents.Media.length == 1 && (contents.viewOffset == 0 || !contents.viewOffset)"  v-on:click.native="playMedia(contents)" class="primary white--text">
                          <v-icon> play_arrow </v-icon>
                        </v-btn>
                        <v-btn block v-else @click.native.stop="dialog = true" class="primary white--text">
                          <v-icon> play_arrow </v-icon>
                        </v-btn>
                      </div>
                      <div v-else>
                        <v-layout row wrap>
                          <v-flex xs12>
                            <div class="pa-2">Now playing on {{ chosenClient.name }} from {{ server.name }}</div>
                          </v-flex>
                          <v-flex xs12>
                            <v-btn block style="background-color: #cc3f3f" v-on:click.native="pressStop()" class="white--text">
                              <v-icon></v-icon> Stop
                            </v-btn>
                          </v-flex>
                          <v-flex xs12>
                            <v-btn block :disabled="manualSyncQueued" color="blue" v-on:click.native="doManualSync" v-if="me.role !== 'host'">Manual sync</v-btn>
                          </v-flex>
                        </v-layout>
                      </div>
                    </v-flex>
                    <div style="width: 100%">
                      <p class="pt-3" style="font-style: italic" v-if="hidden" v-on:click="hiddenOverride = true"> Summary automatically hidden for unwatched content. Click to unhide.</p>
                      <p class="pt-3" style="font-style: italic" v-else> {{ contents.summary }} </p>
                    </div>
                    <v-layout row wrap class="hidden-sm-and-down" justify-start align-start v-if="contents.type === 'movie'">
                      <v-flex lg3 xl2 v-if="contents.Role && contents.Role.length > 0">
                        <v-subheader class="white--text"> Featuring </v-subheader>
                        <div v-for="actor in contents.Role.slice(0, 6)" :key="actor.tag">
                          {{ actor.tag }} <span style="opacity:0.7;font-size:80%"> {{ actor.role }} </span>
                        </div>
                      </v-flex>
                      <v-flex lg3 xl2 v-if="contents.Director && contents.Director.length > 0">
                        <v-subheader class="white--text"> Director </v-subheader>
                        <div v-for="director in contents.Director.slice(0, 3)" :key="director.tag">
                          {{ director.tag }}
                        </div>
                      </v-flex>
                      <v-flex lg3 xl2 v-if="contents.Producer && contents.Producer.length > 0">
                        <v-subheader class="white--text"> Producers </v-subheader>
                        <div v-for="producer in contents.Producer.slice(0, 3)" :key="producer.tag">
                          {{ producer.tag }}
                        </div>
                      </v-flex>
                      <v-flex lg3 xl2 v-if="contents.Writer && contents.Writer.length > 0">
                        <v-subheader class="white--text"> Writers </v-subheader>
                        <div v-for="writer in contents.Writer.slice(0, 3)" :key="writer.tag">
                          {{ writer.tag }}
                        </div>
                      </v-flex>
                    </v-layout>
                  </v-layout>
                </v-flex>
              </v-layout>
              <v-divider></v-divider>
              <div v-if="subsetParentData(6).length >= 0 && contents.type == 'episode'" class="hidden-xs-only">
                <v-subheader>Also in Season {{ contents.parentIndex }} of {{ contents.grandparentTitle }}</v-subheader>
                <v-layout v-if="parentData" row wrap justify-start>
                  <v-flex xs6 md2 xl2 lg2 class="pb-3" v-for="ep in subsetParentData(6)" :key="ep.key">
                    <plexthumb bottomOnly :content="ep" :img="getLittleThumb(ep)" :class="{ highlightBorder: ep.index === contents.index }" style="margin:3%" :server="server" spoilerFilter></plexthumb>
                  </v-flex>
                </v-layout>
              </div>
              <div v-if="relatedItems.length > 0">
                <v-subheader>Related Movies</v-subheader>
                <v-container fill-height fluid>
                  <v-layout row wrap justify-space-around align-center>
                    <v-flex xs4 md1 class="ma-1" v-for="movie in relatedItems" :key="movie.key">
                      <plexthumb :content="movie" :img="getLittleThumb(movie)" style="margin:3%" :server="server" type="thumb"></plexthumb>
                    </v-flex>
                  </v-layout>
                </v-container>

              </div>
            </v-container>
          </div>
        </v-card>
      </div>
      <v-dialog v-if="contents" v-model="dialog" style="background: rgba(0,0,0,0.95); box-shadow: none !important" width="500px">
        <v-card style="overflow: hidden">
          <v-card-title class="headline">Playback Settings</v-card-title>
          <v-checkbox v-if="contents.viewOffset && contents.viewOffset > 0" v-bind:label="'Resume from ' + getDuration(contents.viewOffset) " color="orange lighten-2" class="pa-0 ma-0 ml-3" v-model="resumeFrom"></v-checkbox>
          <div v-for="(media,index) in contents.Media" :key="media.Part[0].key">
            <v-layout row wrap class="pa-2">
              <v-flex xs8>
                <div class="pl-2">{{ media.videoResolution }}p {{ getDuration(media.duration)}}</div>
                <div class="pl-4 soft-text">
                  <div>Video Codec: {{ media.videoCodec }} ({{ media.bitrate }}kbps) </div>
                  <div>
                    Audio Streams: {{ audioStreams(media.Part[0].Stream) }}
                  </div>
                  <div>
                    Subtitles: {{ subtitleStreams(media.Part[0].Stream) }}
                  </div>
                </div>
              </v-flex>
              <v-flex xs4>
                <v-btn class="primary white--text" @click.native.stop="playMedia(contents, index)">
                  Play
                </v-btn>
              </v-flex>
            </v-layout>
          </div>
        </v-card>
      </v-dialog>
    </div>
</template>

<script>
import plexthumb from './plexthumb.vue';

const humanizeDuration = require('humanize-duration');

export default {
  components: {
    plexthumb,
  },
  created() {
  },
  data() {
    return {
      browsingContent: null,

      fullheight: null,
      fullwidth: null,
      resumeFrom: true,

      contents: null,
      status: 'loading..',
      dialog: false,
      related: null,

      parentData: false,

      hiddenOverride: false,

      eventbus: window.eventbus,
    };
  },
  mounted() {
    this.getNewData();
    this.fullheight = this.$refs.root.offsetHeight;
    this.fullwidth = this.$refs.root.offsetWidth;
  },
  beforeDestroy() {},
  watch: {
    ratingKey() {
      this.getNewData();
    },
  },
  computed: {
    plex() {
      return this.$store.getters.getPlex;
    },
    ratingKey() {
      return this.$route.params.ratingKey;
    },
    serverId() {
      return this.$route.params.machineIdentifier;
    },
    server() {
      return this.plex.servers[this.serverId];
    },
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
      if (
        (this.contents && this.contents.viewCount === 0) ||
        !this.contents.viewCount
      ) {
        return true;
      }
    },
    largestRes() {
      let height = 0;
      for (let i = 0; i < this.contents.Media.length; i++) {
        if (parseInt(this.contents.Media[i].videoResolution) > height) {
          height = parseInt(this.contents.Media[i].videoResolution);
        }
      }
      return height;
    },
    calculatedHeight() {
      if (this.height) {
        return `${this.height}em`;
      }
      if (this.contents.type === 'movie') {
        return `${Math.round(this.fullwidth * 2)}px`;
      }
      if (this.contents.type === 'episode') {
        return `${Math.round(this.fullwidth * 2)}px`;
      }
      return `${Math.round(this.fullwidth * 2)}px`;
    },
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    playable() {
      return this.$route.fullPath.indexOf('/nowplaying') === -1;
    },
    relatedItems() {
      if (!this.related) {
        return [];
      }
      if (!this.related || !this.related.MediaContainer || !this.related.MediaContainer) {
        return [];
      }
      if (!this.related.MediaContainer.Hub || !this.related.MediaContainer.Hub.length > 0) {
        return [];
      }
      const items = [];
      this.related.MediaContainer.Hub[0].Metadata.map((item) => {
        items.push(item);
      });
      return items.slice(0, 7);
    },
    getArtUrl() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      if (this.contents.type === 'movie') {
        return this.server.getUrlForLibraryLoc(
          this.contents.art,
          w * 1.5,
          h * 1.5,
          0,
        );
      }
      if (this.contents.type === 'track') {
        return this.server.getUrlForLibraryLoc(
          this.contents.grandparentArt,
          w * 1.5,
          h * 1.5,
          0,
        );
      }
      return this.server.getUrlForLibraryLoc(
        this.contents.grandparentArt,
        w * 1.5,
        h * 1.5,
        0,
      );
    },
    length() {
      return humanizeDuration(this.contents.duration, {
        delimiter: ' ',
        units: ['h', 'm'],
        round: true,
      });
    },
    title() {
      if (this.contents.type === 'episode') {
        return this.contents.grandparentTitle;
      }
      return this.contents.title;
    },
    thumb() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      if (this.contents.type === 'movie') {
        return this.server.getUrlForLibraryLoc(
          this.contents.thumb,
          w / 1,
          h / 1,
        );
      }
      return this.server.getUrlForLibraryLoc(
        this.contents.parentThumb || this.contents.grandparentThumb,
        w / 1,
        h / 1,
      );
    },
  },
  methods: {
    getNewData() {
      this.server.getMediaByRatingKey(this.ratingKey).then(async (result) => {
        if (result) {
          this.contents = result.MediaContainer.Metadata[0];
          if (this.contents.type === 'episode') {
            this.server
              .getSeriesChildren(
                `${this.contents.parentRatingKey}/children`,
                0,
                500,
                1,
              )
              .then((res) => {
                if (res) {
                  this.parentData = res;
                }
              });
          }
          if (this.contents.type === 'movie') {
            try {
              this.related = await this.server.getRelated(this.ratingKey, 12);
            } catch (e) {}
          }
          this.setBackground();
        } else {
          this.status = 'Error loading libraries!';
        }
      });
    },
    setContent(content) {
      this.$router.push(`/browse/${this.serverId}/${content.ratingKey}`);
    },
    doManualSync() {
      this.$store.commit('SET_VALUE', ['manualSyncQueued', true]);
    },
    getLittleThumb(content) {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      return this.server.getUrlForLibraryLoc(content.thumb, w / 2, h / 2, 0);
    },
    setBackground() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      this.$store.commit(
        'SET_BACKGROUND',
        this.server.getUrlForLibraryLoc(this.contents.art, w / 4, h / 4, 2),
      );
    },

    subsetParentData(size) {
      if (
        !this.parentData ||
        !this.parentData.MediaContainer ||
        !this.parentData.MediaContainer.Metadata
      ) {
        return [];
      }
      return this.parentData.MediaContainer.Metadata.slice(
        this.contents.index - 1,
        this.contents.index + size - 1,
      );
    },
    markWatched() {
      this.server.markWatchedByRatingKey(this.contents.ratingKey, () => {
        this.$parent.reset();
      });
    },
    async playMedia(content, mediaIndex) {
      const callback = function () {};
      let offset = 0;
      if (this.resumeFrom) {
        offset = this.contents.viewOffset;
      }

      await this.chosenClient.playMedia({
        ratingKey: this.contents.ratingKey,
        mediaIndex,
        server: this.server,
        offset,
        callback,
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
      this.chosenClient.pressStop((result) => {
      });
    },
    getStreamCount(streams, type) {
      let count = 0;
      streams.forEach((stream) => {
        if (stream.streamType === type) {
          count++;
        }
      });
      return count;
    },
    audioStreams(media) {
      let result = '';
      for (let i = 0; i < media.length; i++) {
        const stream = media[i];
        if (stream.streamType === 2 && stream.languageCode) {
          result =
            `${result} ${stream.languageCode || 'Unknown Lanugage'},`;
        }
      }
      result = result.substring(0, result.length - 1);
      return result;
    },
    subtitleStreams(media) {
      let result = '';
      for (let i = 0; i < media.length; i++) {
        const stream = media[i];
        if (stream.streamType === 3 && stream.languageCode) {
          result =
            `${result} ${stream.languageCode || 'Unknown Lanugage'},`;
        }
      }
      result = result.substring(0, result.length - 1);
      return result;
    },
    reset() {
      this.browsingContent = false;
    },
  },
};
</script>
