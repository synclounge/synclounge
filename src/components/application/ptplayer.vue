<template>
  <div  v-if="GET_METADATA" style="width:100%; position: relative">
    <div style="position: relative" @mouseover="hovered = true" @mouseout="hovered = false">
      <div class="ptplayer">
        <video
          ref="videoPlayer"
          autoplay="true"
          controls="true"
          preload="auto"
          playsinline="true"

          @pause="onPlayerPause"
          @loadeddata="onPlayerLoadeddata"
          @ended="onPlayerEnded"
          @waiting="onPlayerWaiting"
          @playing="onPlayerPlaying"
          @timeupdate="onPlayerTimeUpdate"
          @seeking="onPlayerSeeking"
          @seeked="onPlayerSeeked"
          @volumechange="onPlayerVolumeChange"
          @error="onPlayerError"

          style="background-color:transparent !important;"
          class="video-js"
        >
        </video>
      </div>

      <div>
        <transition name="fade">
          <div v-show="hovered">
            <v-layout row wrap style="position: absolute; top: 0; left: 0; z-index: 2" class="pa-3 hidden-xs-only">
              <img :src="GET_THUMB_URL" class="elevation-20" style="height: 80px; width: auto; vertical-align: middle; margin-left: auto; margin-right: auto;" />
              <v-flex class="pl-3">
                <v-container class="pa-0" fill-height>
                  <v-layout column wrap justify-space-apart>
                    <v-flex>
                      <h1>{{ GET_TITLE }}</h1>
                    </v-flex>

                    <v-flex>
                      <h3>{{ GET_SUBTITLE }}</h3>
                    </v-flex>

                    <v-flex>
                      <h5>Playing from {{ GET_PLEX_SERVER.name  }}</h5>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-flex>
            </v-layout>

            <v-layout row wrap style="position: absolute; top: 0; right: 0; z-index: 2" class="pa-3 hidden-xs-only">
              <v-flex class="text-xs-right pa-1">
                <div class="hidden-xs-only">
                  <v-tooltip bottom color="accent" v-if="me && me.role !== 'host'">
                    <v-icon slot="activator" color="white" class="clickable" :disabled="manualSyncQueued" v-on:click="doManualSync">compare_arrows</v-icon>
                    Manual Sync
                  </v-tooltip>
                  <v-icon slot="activator" color="white" class="clickable pl-3" v-on:click="dialog = !dialog">settings</v-icon>
                  <router-link to="/browse"  slot="activator">
                    <v-icon color="white" class="pl-3" v-on:click.native="stopPlayback()">close</v-icon>
                  </router-link>
                </div>
              </v-flex>
            </v-layout>

            <v-layout row wrap class="hoverBar" style="height: 120px; width: 100%; pointer-events: none; position: absolute; top: 0;">
              <v-flex xs12>
              </v-flex>
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
              :value="GET_MAX_VIDEO_BITRATE"
              :items="GET_QUALITIES"
              item-text="label"
              item-value="maxVideoBitrate"
              persistent-hint
              label="Quality"
              hint="Select a different quality"
              @input="CHANGE_MAX_VIDEO_BITRATE"
            ></v-select>

            <v-select
              :items="GET_AUDIO_STREAMS"
              :value="GET_AUDIO_STREAM_ID"
              :select-text="'Default'"
              label="Audio track"
              item-text="text"
              item-value="id"
              persistent-hint
              hint="Select a different audio track"
              @input="CHANGE_AUDIO_STREAM"
            ></v-select>

            <v-select
              :items="GET_SUBTITLE_STREAMS"
              :value="GET_SUBTITLE_STREAM_ID"
              :select-text="'Default'"
              persistent-hint
              label="Subtitles"
              item-text="text"
              item-value="id"
              hint="Select a different subtitle track"
              @input="CHANGE_SUBTITLE_STREAM"
            ></v-select>

            <v-select
              v-if="GET_MEDIA_LIST.length > 1"
              :items="GET_MEDIA_LIST"
              :value="GET_MEDIA_INDEX"
              persistent-hint
              item-text="text"
              item-value="id"
              hint="Select a different version of the content you're playing"
              label="Version"
              @input="CHANGE_MEDIA_INDEX"
            ></v-select>
          </v-card-text>

          <v-card-actions>
            <v-btn class="blue--text darken-1" flat @click.native="dialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-layout justify-center row class="pa-3 hidden-sm-and-up">
        <v-flex xs12>
          <v-layout row wrap>
            <img :src="GET_THUMB_URL" class="elevation-20" style="height: 80px; width: auto; vertical-align: middle; margin-left: auto; margin-right: auto" />
            <v-flex class="pl-2">
              <v-container class="pa-0" fill-height>
                <v-layout column wrap justify-space-apart>
                  <v-flex>
                    <h1>{{ GET_TITLE }}</h1>
                  </v-flex>
                  <v-flex>
                    <h3>{{ GET_SUBTITLE }}</h3>
                  </v-flex>
                  <v-flex>
                    <h5>Playing from {{ GET_PLEX_SERVER.name  }}</h5>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-flex>
            <v-layout row wrap class="">
              <v-flex xs12>
                <v-btn block :disabled="manualSyncQueued" color="blue" v-on:click.native="doManualSync" v-if="me.role !== 'host'">Manual sync</v-btn>
              </v-flex>
              <v-flex xs12>
                <v-btn block color="primary" v-on:click.native="dialog = !dialog">Playback Settings</v-btn>
              </v-flex>
              <v-flex xs12>
                <router-link to="/browse">
                  <v-btn block color="error" v-on:click.native="stopPlayback()">Stop playback</v-btn>
                </router-link>
              </v-flex>
            </v-layout>
          </v-layout>
        </v-flex>
      </v-layout>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import videojs from 'video.js';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';

import messages from '@/components/messages.vue';

import plexthumb from './plexbrowser/plexthumb.vue';

export default {
  name: 'ptplayer',
  components: {
    plexthumb, messages,
  },

  data() {
    return {
      hovered: false,
      eventbus: window.EventBus,
      dialog: false,
      destroyed: false,
      lastSentTimeline: {},
      metadataLoadedPromise: null,

      videoOptions: {
        language: 'en',
        inactivityTimeout: 2000,
        fluid: true,
        aspectRatio: '16:9',

        controlBar: {
          children: {
            playToggle: {},
            muteToggle: {},
            volumeControl: {},
            currentTimeDisplay: {},

            flexibleWidthSpacer: {},
            progressControl: {},
            timeDivider: {},
            liveDisplay: {},
            durationDisplay: {},
            fullscreenToggle: {},
          },
        },
      },
    };
  },

  created() {
    this.metadataLoadedPromise = this.FETCH_METADATA();
  },

  async mounted() {
    console.log('UHHH PTPLAYER MOUNTED');

    await this.metadataLoadedPromise;
    this.mountVideojs();

    // Similuate a real plex client
    this.commandListener = this.eventbus.$on('command', (data) => {
      if (this.destroyed) {
        return;
      }

      const { command } = data;

      switch (command) {
        case '/player/timeline/poll': {
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

        case '/player/playback/play': {
          return this.eventbus.$emit('player-press-play', res => data.callback(res));
        }

        case '/player/playback/pause': {
          return this.eventbus.$emit('player-press-pause', res => data.callback(res));
        }

        case '/player/playback/playMedia': {
          this.chosenKey = data.params.key.replace('/library/metadata/', '');
          this.chosenMediaIndex = data.params.mediaIndex || 0;
          this.chosenServer = this.plex.servers[data.params.machineIdentifier];
          this.playertime = data.params.offset || this.$route.query.playertime || 0;
          this.offset = this.playertime;
          this.$nextTick(() => {
            this.changedPlaying(true);
          });
          return true;
        }

        case '/player/playback/stop': {
          this.chosenKey = null;
          this.chosenServer = null;
          this.playerduration = null;
          this.playertime = 0;
          this.playingMetadata = null;
          this.$router.push('/browse');
          return data.callback(true);
        }

        case '/player/playback/seekTo': {
          return this.eventbus.$emit('player-seek', {
            time: data.params.offset,
            soft: data.params.softSeek,
            callback: async (promise) => {
              await promise.catch((e) => {
                data.callback(false);
              });
              data.callback(true);
            },
          });
        }

        default: {
          return '';
        }
      }
    });
  },

  beforeDestroy() {
    this.destroyed = true;

    this.eventbus.$off('player-press-pause');
    this.eventbus.$off('player-press-play');
    this.eventbus.$off('player-seek');
    this.eventbus.$off('ptplayer-poll');

    this.CHANGE_PLAYER_STATE('stopped');
    this.SEND_PLEX_TIMELINE_UPDATE();
  },

  computed: {
    ...mapState(['manualSyncQueued', 'me']),
    ...mapGetters(['GET_HOST_PLAYER_STATE']),
    ...mapGetters('slplayer', [
      'GET_METADATA',
      'GET_SUBTITLE_STREAMS',
      'GET_AUDIO_STREAMS',
      'GET_QUALITIES',
      'GET_INIT_URL',
      'GET_MAX_VIDEO_BITRATE',
      'GET_SRC_URL',
      'GET_AUDIO_STREAM_ID',
      'GET_SUBTITLE_STREAM_ID',
      'GET_MEDIA_LIST',
      'GET_MEDIA_INDEX',
      'GET_THUMB_URL',
      'GET_PLEX_SERVER',
      'GET_TITLE',
      'GET_SUBTITLE',
      'GET_PLAYER_STATE',
      'GET_OFFSET',
      'GET_PLAYER',
    ]),

    chosenClient() {
      return this.$store.getters.getChosenClient;
    },


    metadataImage() {
      const w = Math.round(Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0,
      ));
      const h = Math.round(Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0,
      ));

      return this.server.getUrlForLibraryLoc(this.metadata.thumb, w / 12, h / 4);
    },
  },

  methods: {
    ...mapActions('slplayer', [
      'FETCH_METADATA',
      'CHANGE_MAX_VIDEO_BITRATE',
      'CHANGE_AUDIO_STREAM',
      'CHANGE_SUBTITLE_STREAM',
      'CHANGE_MEDIA_INDEX',
      'CHANGE_PLAYER_SRC',
      'SEND_PLEX_TIMELINE_UPDATE',
      'CHANGE_PLAYER_STATE',
    ]),

    ...mapMutations('slplayer', [
      'SET_PLAYER',
    ]),

    mountVideojs() {
      console.log('MOUNTING VIDEOJS');
      this.SET_PLAYER(videojs(this.$refs.videoPlayer, this.videoOptions, this.onPlayerReady));
    },

    onPlayerReady() {
      console.log('PLAYER READY');
      this.CHANGE_PLAYER_SRC();

      this.GET_PLAYER.volume(this.$store.getters.getSettings.PTPLAYERVOLUME || 100);
      this.GET_PLAYER.currentTime(this.GET_OFFSET / 1000);

      // Events from the parent component
      this.eventbus.$on('player-press-pause', (callback) => {
        if (this.GET_PLAYER_STATE !== 'paused') {
          this.GET_PLAYER.pause();
        }
        return callback();
      });

      this.eventbus.$on('player-press-play', (callback) => {
        if (this.GET_PLAYER_STATE !== 'playing') {
          this.GET_PLAYER.play();
        }
        return callback();
      });

      this.eventbus.$on('player-seek', async (data) => {
      // Return a promise through the callback
        data.callback(this.seekMethod(data));
      });

      this.eventbus.$on('ptplayer-poll', (callback) => {
        try {
          return callback(null, this.playerCurrentTimeMs());
        } catch (e) {
          return callback(e, -1);
        }
      });
    },

    onPlayerLoadeddata() {
      return this.periodicPlexTimelineUpdate();
    },

    onPlayerPause() {
      console.log('pause');
      this.CHANGE_PLAYER_STATE('paused');
      this.timelineUpdate();
    },

    onPlayerEnded(event) {
      this.$router.push('/browse');
      this.$emit('playbackEnded', event);
    },

    onPlayerError(event) {
      this.$emit('playerError', event);
    },

    onPlayerSeeking() {
      console.log('Seeking');
      this.CHANGE_PLAYER_STATE('buffering');
      this.timelineUpdate();
    },

    onPlayerSeeked() {
      console.log('Seeked');
      this.CHANGE_PLAYER_STATE(this.GET_PLAYER.paused() ? 'paused' : 'playing');
      this.timelineUpdate();
    },

    onPlayerTimeUpdate() {
      if (!this.destroyed) {
        this.timelineUpdate();
      }
    },

    onPlayerPlaying() {
      console.log('playing');
      this.CHANGE_PLAYER_STATE('playing');
    },

    onPlayerWaiting() {
      console.log('WAITINGGGG');
      this.CHANGE_PLAYER_STATE('buffering');
      this.timelineUpdate();
    },

    onPlayerVolumeChange() {
      this.$store.commit('setSetting', ['PTPLAYERVOLUME', this.GET_PLAYER.volume() || 0]);
    },

    async periodicPlexTimelineUpdate() {
      // Send out a timeline update to plex periodically.

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.destroyed) {
          return true;
        }

        const delayPromise = this.delay(10000);
        // eslint-disable-next-line no-await-in-loop
        await this.SEND_PLEX_TIMELINE_UPDATE().catch(e => e);
        // eslint-disable-next-line no-await-in-loop
        await delayPromise;
      }
    },

    isTimeInBufferedRange(time) {
      const bufferedTimeRange = this.GET_PLAYER.buffered();

      // There can be multiple ranges
      for (let i = 0; i < bufferedTimeRange.length; ++i) {
        if (time >= bufferedTimeRange.start(i) * 1000 && time <= bufferedTimeRange.end(i) * 1000) {
          return true;
        }
      }

      return false;
    },

    async seekMethod({ soft, time: seekToMs }) {
      console.log('Seeking: ', seekToMs);
      console.log('Currentime: ', this.playerCurrentTimeMs());
      // Parent will only send this command if we are within 10s,
      // lets change playback speed to 3x to catch up

      // eslint-disable-next-line no-underscore-dangle
      if (Number.isNaN(this.playerDurationMs())) {
        throw new Error('Player is not ready');
      }

      if (soft) {
        return this.softSeek(seekToMs);
      }

      return this.normalSeek(seekToMs);
    },

    softSeek(seekToMs) {
      if (!this.isTimeInBufferedRange(seekToMs)) {
        throw new Error('Soft seek requested but not within buffered range');
      }

      this.GET_PLAYER.currentTime(seekToMs / 1000);
      return true;
    },

    promiseWithTimeout(timeoutMs, promise) {
      return Promise.race([
        promise(),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timed out')), timeoutMs)),
      ]);
    },

    seekedPromise() {
      return new Promise((resolve) => {
        this.GET_PLAYER.one('seeked', (e) => {
          resolve(e.data);
        });
      });
    },

    async normalSeek(seekToMs) {
      if ((Math.abs(seekToMs - this.lastTime) < 3000 && this.GET_HOST_PLAYER_STATE === 'playing')) {
        let cancelled = false;

        window.EventBus.$once('host-playerstate-change', () => {
          cancelled = true;
        });

        let iterations = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-underscore-dangle
          if (cancelled || this.GET_PLAYER_STATE !== 'playing') {
            this.GET_PLAYER.playbackRate(1.0);
            throw new Error('Slow seek was stop due to buffering or pausing');
          }

          const delayPromise = this.delay(25);

          // 25 here because interval is 25ms
          const expectedHostTimeMs = seekToMs + (25 * iterations);

          const difference = expectedHostTimeMs - this.playerCurrentTimeMs();
          const absDifference = Math.abs(difference);

          if (absDifference < 30) {
            this.GET_PLAYER.playbackRate(1.0);
            return true;
          }

          if (absDifference > 5000) {
            this.GET_PLAYER.playbackRate(1.0);
            throw new Error('Slow seek was stopped as we are beyond 5000ms');
          }

          if (difference > 0) {
            if (this / this.GET_PLAYER.playbackRate() < 1.02) {
              // Speed up
              this.GET_PLAYER.playbackRate(this.GET_PLAYER.playbackRate() + 0.0001);
            }
          } else if (this.GET_PLAYER.playbackRate() > 0.98) {
            // Slow down
            this.GET_PLAYER.playbackRate(this.GET_PLAYER.playbackRate() - 0.0001);
          }

          // eslint-disable-next-line no-await-in-loop
          await delayPromise;

          iterations += 1;
        }
      } else {
        this.GET_PLAYER.currentTime(seekToMs / 1000);
        return this.promiseWithTimeout(this.seekedPromise(), 15000);
      }
    },

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    playerCurrentTimeMs() {
      return this.GET_PLAYER.currentTime() * 1000;
    },

    playerDurationMs() {
      return this.GET_PLAYER.duration() * 1000;
    },

    doManualSync() {
      this.$store.commit('SET_VALUE', ['manualSyncQueued', true]);
    },

    stopPlayback() {
      console.log('Stopped Playback');
      this.$store.commit('SET_VALUE', ['decisionBlocked', false]);
      axios.get(this.getSourceByLabel(this.chosenQuality).stopUrl);

      this.playerstatus = 'stopped';
      this.sessionId = this.generateGuid();
      this.xplexsession = this.generateGuid();
      this.chosenClient.pressStop(() => {});
    },

    timelineUpdate() {
      const time = this.playerCurrentTimeMs();
      const duration = this.playerDurationMs();
      const status = this.GET_PLAYER_STATE;

      this.playertime = time;
      this.playerstatus = status;
      this.playerduration = duration;

      if (this.lastSentTimeline.state !== this.playerstatus || this.chosenKey !== this.lastSentTimeline.key) {
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
        this.chosenClient.updateTimelineObject(playerdata);
      }
    },
  },
};
</script>

<style scoped>
  .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw) - 150px);
  }
  .is-fullscreen .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw));
  }
</style>


<style src="video.js/dist/video-js.css">
</style>
