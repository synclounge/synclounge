<template>
  <div style="width:100%; position: relative">
    <div style="position: relative" @mouseover="hovered = true" @mouseout="hovered = false">
      <videoplayer
        v-if="playingMetadata && chosenServer && GET_SLPLAYERQUALITY && ready"
        @playerMounted="playerMounted()"
        @timelineUpdate="timelineUpdate"
        @playbackEnded="stopPlayback()"
        :metadata="playingMetadata"
        :server="chosenServer"
        :src="getSourceByLabel(GET_SLPLAYERQUALITY)"
        :initUrl="getSourceByLabel(GET_SLPLAYERQUALITY).initUrl"
        :params="getSourceByLabel(GET_SLPLAYERQUALITY).params"
        :initialOffset="offset"
        :createdAt="playerCreatedAt"
      ></videoplayer>
      <div v-if="playingMetadata && chosenServer">
        <transition name="fade">
          <div v-show="hovered">
            <v-layout
              row
              wrap
              style="position: absolute; top: 0; left: 0; z-index: 2"
              class="pa-3 hidden-xs-only"
            >
              <img
                :src="thumbUrl"
                class="elevation-20"
                style="height: 80px; width: auto; vertical-align: middle; margin-left: auto; margin-right: auto;"
              />
              <v-flex class="pl-3">
                <v-container class="pa-0" fill-height>
                  <v-layout column wrap justify-space-apart>
                    <v-flex>
                      <h1>{{ getTitle(playingMetadata) }}</h1>
                    </v-flex>
                    <v-flex>
                      <h3>{{ getUnder(playingMetadata) }}</h3>
                    </v-flex>
                    <v-flex>
                      <h5>Playing from {{ chosenServer.name }}</h5>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-flex>
            </v-layout>
            <v-layout
              row
              wrap
              style="position: absolute; top: 0; right: 0; z-index: 2"
              class="pa-3 hidden-xs-only"
            >
              <v-flex class="text-xs-right pa-1">
                <div class="hidden-xs-only">
                  <v-tooltip bottom color="accent" v-if="GET_ME && GET_ME.role !== 'host'">
                    <v-icon
                      color="white"
                      class="clickable"
                      :disabled="GET_MANUAL_SYNC_QUEUED"
                      v-on:click="TRIGGER_MANUAL_SYNC"
                      >compare_arrows</v-icon
                    >
                    Manual Sync
                  </v-tooltip>
                  <v-icon color="white" class="clickable pl-3" v-on:click="dialog = !dialog"
                    >settings</v-icon
                  >
                  <router-link to="/browse">
                    <v-icon color="white" class="pl-3" v-on:click.native="stopPlayback()"
                      >close</v-icon
                    >
                  </router-link>
                </div>
              </v-flex>
            </v-layout>
            <v-layout
              row
              wrap
              class="hoverBar"
              style="height: 120px; width: 100%; pointer-events: none; position: absolute; top: 0;"
            >
              <v-flex xs12> </v-flex>
            </v-layout>
          </div>
        </transition>
      </div>
      <div class="messages-wrapper" v-if="$vuetify.breakpoint.mdAndDown">
        <messages></messages>
      </div>
      <v-dialog v-model="dialog" width="350">
        <v-card>
          <v-card-title>Playback Settings </v-card-title>
          <v-card-text>
            <v-select
              :value="GET_SLPLAYERQUALITY"
              @input="changeQuality"
              :items="qualitiesSelect"
              item-text="text"
              item-value="id"
              persistent-hint
              label="Quality"
              hint="Select a different quality"
            ></v-select>
            <v-select
              v-model="chosenAudioTrackIndex"
              :select-text="'Default'"
              label="Audio track"
              item-text="text"
              item-value="id"
              persistent-hint
              hint="Select a different audio track"
              :items="audioTrackSelect"
            ></v-select>
            <v-select
              persistent-hint
              label="Subtitles"
              item-text="text"
              item-value="id"
              hint="Select a different subtitle track"
              v-model="chosenSubtitleIndex"
              :select-text="'Default'"
              :items="subtitleTrackSelect"
            ></v-select>
            <v-select
              v-if="mediaIndexSelect.length > 1"
              persistent-hint
              item-text="text"
              item-value="id"
              hint="Select a different version of the content you're playing"
              v-model="chosenMediaIndex"
              label="Version"
              :items="mediaIndexSelect"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-btn class="blue--text darken-1" text @click.native="dialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-layout
        v-if="playingMetadata && chosenServer"
        justify-center
        row
        class="pa-3 hidden-sm-and-up"
      >
        <v-flex xs12>
          <v-layout row wrap>
            <img
              :src="thumbUrl"
              class="elevation-20"
              style="height: 80px; width: auto; vertical-align: middle; margin-left: auto; margin-right: auto"
            />
            <v-flex class="pl-2">
              <v-container class="pa-0" fill-height>
                <v-layout column wrap justify-space-apart>
                  <v-flex>
                    <h1>{{ getTitle(playingMetadata) }}</h1>
                  </v-flex>
                  <v-flex>
                    <h3>{{ getUnder(playingMetadata) }}</h3>
                  </v-flex>
                  <v-flex>
                    <h5>Playing from {{ chosenServer.name }}</h5>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-flex>
            <v-layout row wrap class="">
              <v-flex xs12>
                <v-btn
                  block
                  :disabled="GET_MANUAL_SYNC_QUEUED"
                  color="blue"
                  v-on:click.native="TRIGGER_MANUAL_SYNC"
                  v-if="GET_ME.role !== 'host'"
                  >Manual sync</v-btn
                >
              </v-flex>
              <v-flex xs12>
                <v-btn block color="primary" v-on:click.native="dialog = !dialog"
                  >Playback Settings</v-btn
                >
              </v-flex>
              <v-flex xs12>
                <router-link to="/browse">
                  <v-btn block color="error" v-on:click.native="stopPlayback()"
                    >Stop playback</v-btn
                  >
                </router-link>
              </v-flex>
            </v-layout>
          </v-layout>
        </v-flex>
      </v-layout>
    </div>
  </div>
</template>

<style scoped>
.messages-wrapper {
  height: calc(100vh - (0.5625 * 100vw) - 150px);
}
.is-fullscreen .messages-wrapper {
  height: calc(100vh - (0.5625 * 100vw));
}
</style>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { encodeUrlParams } from '@/utils/encoder';

import videoplayer from './ptplayer/videoplayer.vue';
import messages from '@/components/messages.vue';


const request = require('request');
const parseXMLString = require('xml2js').parseString;

export default {
  name: 'ptplayer',
  components: {
    videoplayer,
    messages,
  },
  mounted() {
    // Check if we have params
    if (this.$route.query.start) {
      // We need to auto play
      const query = this.$route.query;
      this.chosenKey = query.key.replace('/library/metadata/', '');
      this.chosenMediaIndex = query.mediaIndex || 0;
      this.chosenServer = this.getPlex.servers[query.chosenServer];
      this.offset = query.playertime;
    }

    // Similuate a real plex client
    this.commandListener = this.eventbus.$on('command', (data) => {
      if (this.destroyed) {
        return;
      }
      if (data.command === '/player/timeline/poll') {
        const key = this.chosenKey;
        let ratingKey = null;
        if (key) {
          ratingKey = `/library/metadata/${key}`;
        }

        let machineIdentifier = null;
        if (this.chosenServer) {
          machineIdentifier = this.chosenServer.clientIdentifier;
        }
        const playerdata = {
          key,
          ratingKey,
          time: this.playertime,
          type: 'video',
          machineIdentifier,
          duration: this.playerduration,
          state: this.playerstatus,
        };
        this.lastSentTimeline = playerdata;
        if (this.playertime) {
          this.eventbus.$emit('ptplayer-poll', (err, time) => {
            if (err) {
              return data.callback(this.playertime);
            }
            // let difference = Math.abs(time - this.playertime)
            // console.log('Poll time was out by', difference)
            playerdata.time = time;
            this.playertime = time;
            data.callback(playerdata);
          });
        } else {
          data.callback(playerdata);
        }
        return;
      }
      if (data.command === '/player/playback/play') {
        this.eventbus.$emit('player-press-play', (res) => data.callback(res));
        return;
      }
      if (data.command === '/player/playback/pause') {
        this.eventbus.$emit('player-press-pause', (res) => data.callback(res));
        return;
      }
      if (data.command === '/player/playback/playMedia') {
        this.chosenKey = data.params.key.replace('/library/metadata/', '');
        this.chosenMediaIndex = data.params.mediaIndex || 0;
        this.chosenServer = this.getPlex.servers[data.params.machineIdentifier];
        this.playertime = data.params.offset || this.$route.query.playertime || 0;
        this.offset = this.playertime;
        this.$nextTick(() => {
          this.changedPlaying(true);
        });
        return true;
      }
      if (data.command === '/player/playback/stop') {
        this.ready = false;
        this.chosenKey = null;
        this.chosenServer = null;
        this.playerduration = null;
        this.playertime = 0;
        this.bufferedTile = null;
        this.playingMetadata = null;
        this.$router.push('/browse');
        return data.callback(true);
      }
      if (data.command === '/player/playback/seekTo') {
        this.eventbus.$emit('player-seek', {
          time: data.params.offset,
          soft: data.params.softSeek,
          callback: async (promise) => {
            await promise.catch(() => {
              data.callback(false);
            });
            data.callback(true);
          },
        });
      }
    });
  },
  data() {
    return {
      hovered: false,
      eventbus: window.EventBus,

      chosenKey: null, // The item we are going to be playing from the chosen server eg. 12345
      chosenServer: null, // The Plex Media Server we are going to play from
      sessionId: this.generateGuid(),
      xplexsession: this.generateGuid(),

      // Content can have multiple copies
      // Below are options chosen for each copy
      chosenMediaIndex: 0, // The index of the item we want to play
      chosenSubtitleIndex: 0, // Subtitle track index
      chosenAudioTrackIndex: 0, // Audio track index
      sources: [],

      // Player status
      playertime: 0,
      playerstatus: 'stopped',
      playerduration: 0,
      bufferedTill: 0,
      playerCreatedAt: new Date().getTime(),

      // These are changed by the watched functions
      playingMetadata: null,
      ready: false,
      transcodeSessionMetadata: {},
      offset: 0,

      // Browser
      browser: this.getBrowser(),
      dialog: false,
      destroyed: false,

      lastSentTimeline: {},
    };
  },
  watch: {
    chosenKey() {
      this.changedPlaying(true);
    },
    chosenServer() {
      this.changedPlaying(true);
    },
    chosenMediaIndex() {
      this.chosenSubtitleIndex = 0;
      this.chosenAudioTrackIndex = 0;
      this.changedPlaying(false);
    },
    chosenAudioTrackIndex() {
      // console.log('Audio track change')
      const audioStreamID = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[
        this.chosenAudioTrackIndex
      ].id;
      const baseparams = this.getSourceByLabel(this.chosenQuality).params;
      const params = {
        audioStreamID,
        'X-Plex-Product': baseparams['X-Plex-Product'],
        'X-Plex-Version': baseparams['X-Plex-Version'],
        'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
        'X-Plex-Platform': baseparams['X-Plex-Platform'],
        'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
        'X-Plex-Device': baseparams['X-Plex-Device'],
        'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
        'X-Plex-Device-Screen-Resolution': baseparams['X-Plex-Device-Screen-Resolution'],
        'X-Plex-Token': baseparams['X-Plex-Token'],
      };

      const query = encodeUrlParams(params);

      const url = `${this.chosenServer.chosenConnection.uri}/library/parts/${
        this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id
      }?${query}`;
      this.ready = false;
      const options = {
        method: 'PUT',
        url,
      };
      request(options, (error) => {
        if (!error) {
          this.changedPlaying(false);
        }
        // console.log(error)
      });
    },
    chosenSubtitleIndex() {
      // console.log('Subtitle track change')
      let subtitleStreamID = 0;
      if (this.chosenSubtitleIndex > -1) {
        subtitleStreamID = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[
          this.chosenSubtitleIndex
        ].id;
      }
      const baseparams = this.getSourceByLabel(this.GET_SLPLAYERQUALITY).params;
      const params = {
        subtitleStreamID,
        'X-Plex-Product': baseparams['X-Plex-Product'],
        'X-Plex-Version': baseparams['X-Plex-Version'],
        'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
        'X-Plex-Platform': baseparams['X-Plex-Platform'],
        'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
        'X-Plex-Device': baseparams['X-Plex-Device'],
        'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
        'X-Plex-Device-Screen-Resolution': baseparams['X-Plex-Device-Screen-Resolution'],
        'X-Plex-Token': baseparams['X-Plex-Token'],
      };

      const query = encodeUrlParams(params);
      const url = `${this.chosenServer.chosenConnection.uri}/library/parts/${
        this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id
      }?${query}`;
      this.ready = false;
      const options = {
        method: 'PUT',
        url,
      };
      request(options, (error) => {
        if (!error) {
          this.changedPlaying(false);
        }
        // console.log(error)
      });
    },
  },
  computed: {
    ...mapGetters(['getPlex', 'getChosenClient', 'GET_MANUAL_SYNC_QUEUED', 'GET_ME']),
    ...mapGetters('settings', ['GET_SLPLAYERQUALITY', 'GET_SLPLAYERFORCETRANSCODE']),
    chosenCombo() {
      // Helper for our watch chosenCombo
      return this.chosenKey || this.chosenServer;
    },
    mediaIndexSelect() {
      const mediaDone = [];
      if (!this.playingMetadata) {
        return mediaDone;
      }
      for (let i = 0; i < this.playingMetadata.Media.length; i++) {
        const current = this.playingMetadata.Media[i];
        mediaDone.push({
          id: i,
          text: `${current.videoResolution}p  (${current.videoCodec} ${current.bitrate}kbps)`,
        });
      }
      return mediaDone;
    },
    audioTrackSelect() {
      const audioTracks = [];
      if (!this.playingMetadata) {
        return audioTracks;
      }
      if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length === 1) {
        return audioTracks;
      }
      for (
        let i = 0;
        i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length;
        i++
      ) {
        const current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i];
        if (current.streamType === 2) {
          audioTracks.push({
            id: i,
            text: `${current.language} (${current.codec} ${current.audioChannelLayout})`,
          });
        }
      }
      return audioTracks;
    },
    subtitleTrackSelect() {
      const subtitleTracks = [];
      if (!this.playingMetadata) {
        return subtitleTracks;
      }
      if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length === 1) {
        return subtitleTracks;
      }
      subtitleTracks.push({
        id: -1,
        text: 'None',
      });
      for (
        let i = 0;
        i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length;
        i++
      ) {
        const current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i];
        if (current.streamType === 3) {
          subtitleTracks.push({
            id: i,
            text: `${current.language} (${current.codec})`,
          });
        }
      }

      return subtitleTracks;
    },
    qualitiesSelect() {
      const sourcesDone = [];
      for (let i = 0; i < this.sources.length; i++) {
        sourcesDone.push({
          id: this.sources[i].label,
          text: this.sources[i].label,
        });
      }
      return sourcesDone;
    },
    thumbUrl() {
      if (!this.playingMetadata) {
        return;
      }
      return this.getPlex.servers[this.$route.query.chosenServer].getUrlForLibraryLoc(
        this.playingMetadata.grandparentThumb || this.playingMetadata.thumb,
        200,
        200,
      );
    },
  },
  beforeDestroy() {
    this.destroyed = true;
  },
  methods: {
    ...mapActions(['TRIGGER_MANUAL_SYNC']),
    ...mapMutations('settings', ['SET_SLPLAYERQUALITY']),
    changeQuality(quality) {
      this.changedPlaying(false);
      this.SET_SLPLAYERQUALITY(quality);
    },
    playerMounted() {
      // console.log('Child player said it is mounted')
    },
    getSourceByLabel(label) {
      for (let i = 0; i < this.sources.length; i++) {
        const source = this.sources[i];
        if (source.label === label) {
          return source;
        }
      }
      return null;
    },
    openModal() {
      return this.$refs.playersettingsModal.open();
    },
    getTitle(content) {
      switch (content.type) {
        case 'movie':
          if (this.fullTitle !== undefined) {
            if (content.year) {
              return `${content.title} (${content.year})`;
            }
          }
          return content.title;
        case 'show':
          return content.title;
        case 'season':
          if (this.fullTitle !== undefined) {
            return content.parentTitle;
          }
          return content.title;
        case 'episode':
          if (this.fullTitle !== undefined) {
            return content.title;
          }
          return content.grandparentTitle;
        default:
          return content.title;
      }
    },
    getUnder(content) {
      switch (content.type) {
        case 'movie':
          if (content.year) {
            return content.year;
          }
          return ' ';
        case 'show':
          if (content.childCount === 1) {
            return `${content.childCount} season`;
          }
          return `${content.childCount} seasons`;
        case 'season':
          if (this.fullTitle !== undefined) {
            return content.title;
          }
          return `${content.leafCount} episodes`;
        case 'album':
          return content.year;
        case 'artist':
          return '';
        case 'episode':
          if (this.fullTitle !== undefined) {
            return `Episode ${content.index}`;
          }
          return ` S${content.parentIndex}E${content.index} - ${content.title}`;
        default:
          return content.title;
      }
    },
    generateSources() {
      const that = this;
      const QualityTemplate = function(label, resolution, bitrate, videoQuality) {
        const session = that.generateGuid();
        this.label = label;
        this.initUrl = that.makeTranscodeSessionUrl({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality,
          session,
        });
        this.params = that.getBaseParams({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality,
          session,
        });
        this.src = that.generateTranscodeUrl({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality,
          session,
        });
        this.stopUrl = that.generateTranscodeStopUrl({
          session,
        });
        this.type = 'application/x-mpegURL';
      };
      const qualities = [
        new QualityTemplate('64 Kbps', '220x128', 64, 10),
        new QualityTemplate('96 Kbps', '220x128', 96, 20),
        new QualityTemplate('208 Kbps', '284x160', 208, 30),
        new QualityTemplate('320 Kbps', '420x240', 320, 30),
        new QualityTemplate('720 Kbps', '576x320', 720, 40),
        new QualityTemplate('1.5 Mbps 480p', '720x480', 1500, 60),
        new QualityTemplate('2 Mbps 720p', '1280x720', 2000, 60),
        new QualityTemplate('3 Mbps 720p', '1280x720', 3000, 75),
        new QualityTemplate('4 Mbps 720p', '1280x720', 4000, 100),
        new QualityTemplate('8 Mbps 1080p', '1920x1080', 8000, 60),
        new QualityTemplate('10 Mbps 1080p', '1920x1080', 10000, 75),
        new QualityTemplate('12 Mbps 1080p', '1920x1080', 12000, 90),
        new QualityTemplate('20 Mbps 1080p', '1920x1080', 20000, 100),
        new QualityTemplate('Original', null, null, null),
      ];
      return qualities.reverse();
    },
    stopPlayback() {
      this.$store.commit('SET_VALUE', ['decisionBlocked', false]);
      request(this.getSourceByLabel(this.GET_SLPLAYERQUALITY).stopUrl, () => {});
      this.playerstatus = 'stopped';
      this.sessionId = this.generateGuid();
      this.xplexsession = this.generateGuid();
      this.getChosenClient.pressStop(() => {});
    },
    changedPlaying(changeItem) {
      this.ready = false;
      this.$store.commit('SET_VALUE', ['decisionBlocked', false]);
      if (!this.chosenKey || !this.chosenServer) {
        this.playerstatus = 'stopped';
        this.playerMetadata = null;
        return;
      }

      if (!changeItem) {
        // Update offset to current time to resume where we were
        this.offset = this.playertime;
      }

      const req = () => {
        this.sources = this.generateSources();
        request(
          this.getSourceByLabel(this.GET_SLPLAYERQUALITY).initUrl,
          (error, response, body) => {
            parseXMLString(body, (err, result) => {
              if (err) {
                this.ready = false;
              }
              this.ready = true;
              this.transcodeSessionMetadata = result;
            });
          },
        );
      };

      if (this.playingMetadata) {
        request(this.getSourceByLabel(this.GET_SLPLAYERQUALITY).stopUrl, () => {
          // We dont need to know what this resulted in
        });
      }
      if (changeItem || !this.playingMetadata) {
        this.playingMetadata = null;
        this.chosenServer.getMediaByRatingKey(this.chosenKey).then((result) => {
          this.playingMetadata = result.MediaContainer.Metadata[0];
          req();
        });
      } else {
        req();
      }
    },
    timelineUpdate(data) {
      this.playertime = data.time;
      this.playerstatus = data.status;
      this.bufferedTill = data.bufferedTill;
      this.playerduration = data.duration;

      if (
        this.lastSentTimeline.state !== data.status ||
        this.chosenKey !== this.lastSentTimeline.key
      ) {
        const key = this.chosenKey;
        let ratingKey = null;
        if (key) {
          ratingKey = `/library/metadata/${key}`;
        }
        let machineIdentifier = null;
        if (this.chosenServer) {
          machineIdentifier = this.chosenServer.clientIdentifier;
        }
        const playerdata = {
          key,
          ratingKey,
          time: this.playertime,
          type: 'video',
          machineIdentifier,
          duration: this.playerduration,
          state: this.playerstatus,
        };
        this.lastSentTimeline = playerdata;
        this.getChosenClient.updateTimelineObject(playerdata);
      }
    },
    generateTranscodeUrl(overrideparams) {
      const params = this.getBaseParams(overrideparams);

      const query = encodeUrlParams(params);
      const url = `${this.chosenServer.chosenConnection.uri}/video/:/transcode/universal/start.m3u8?${query}`;
      // console.log(url)
      return url;
    },
    generateTranscodeStopUrl(overrideparams) {
      const params = {
        session: this.sessionId,
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': '3.4.1',
        'X-Plex-Client-Identifier': 'SyncLounge',
        'X-Plex-Platform': this.browser,
        'X-Plex-Platform-Version': '57.0',
        'X-Plex-Device': 'Windows',
        'X-Plex-Device-Screen-Resolution': `${window.screen.availWidth}x${window.screen.availHeight}`,
        'X-Plex-Token': this.chosenServer.accessToken,
      };
      for (const key in overrideparams) {
        if (!overrideparams[key]) {
          delete params[key];
        } else {
          params[key] = overrideparams[key];
        }
      }

      const query = encodeUrlParams(params);
      const url = `${this.chosenServer.chosenConnection.uri}/video/:/transcode/universal/stop?${query}`;
      // console.log(url)
      return url;
    },
    makeTranscodeSessionUrl(overrideparams) {
      // We need to tell the Plex Server to start transcoding
      const params = this.getBaseParams(overrideparams);

      const query = encodeUrlParams(params);
      const url = `${this.chosenServer.chosenConnection.uri}/video/:/transcode/universal/decision?${query}`;
      return url;
    },
    getBaseParams(overrideparams) {
      let location = 'wan';
      if (
        this.getPlex.servers[this.playingMetadata.machineIdentifier].publicAddressMatches === '1'
      ) {
        location = 'lan';
      }
      const params = {
        hasMDE: 1,
        path: this.playingMetadata.key,
        mediaIndex: this.chosenMediaIndex,
        partIndex: 0,
        protocol: 'hls',
        fastSeek: 1,
        directPlay: 0,
        directStream: 1,
        subtitleSize: 100,
        audioBoost: 100,
        location,
        session: this.sessionId,
        offset: 0,
        // offset: Math.round(this.playertime / 1000),
        time: Math.round(this.playertime / 1000),
        subtitles: 'burn',
        copyts: 1,
        'Accept-Language': 'en',
        'X-Plex-Session-Identifier': this.xplexsession,
        'X-Plex-Chunked': 1,
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': '3.4.1',
        'X-Plex-Client-Identifier': 'SyncLounge',
        'X-Plex-Platform': 'SyncLounge',
        'X-Plex-Platform-Version': '57.0',
        'X-Plex-Device': 'Web',
        'X-Plex-Device-Name': 'SyncLounge',
        'X-Plex-Device-Screen-Resolution': `${window.screen.availWidth}x${window.screen.availHeight}`,
        'X-Plex-Token': this.chosenServer.accessToken,
      };
      if (this.GET_SLPLAYERFORCETRANSCODE) {
        params.directStream = 0;
        params['X-Plex-Device'] = 'HTML TV App';
      }
      for (const key in overrideparams) {
        if (!overrideparams[key]) {
          delete params[key];
        } else {
          params[key] = overrideparams[key];
        }
      }
      return params;
    },
    generateGuid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + s4() + s4();
    },
    getBrowser() {
      let sBrowser;
      const sUsrAg = navigator.userAgent;
      if (sUsrAg.indexOf('Chrome') > -1) {
        sBrowser = 'Chrome';
      } else if (sUsrAg.indexOf('Safari') > -1) {
        sBrowser = 'Safari';
      } else if (sUsrAg.indexOf('Opera') > -1) {
        sBrowser = 'Opera';
      } else if (sUsrAg.indexOf('Firefox') > -1) {
        sBrowser = 'Firefox';
      } else if (sUsrAg.indexOf('MSIE') > -1) {
        sBrowser = 'Microsoft Internet Explorer';
      }
      return sBrowser;
    },
  },
};
</script>

<style>
</style>