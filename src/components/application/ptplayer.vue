<template>
  <div  v-if="GET_METADATA" style="width:100%; position: relative">
    <div style="position: relative" @mouseover="hovered = true" @mouseout="hovered = false">
      <videoplayer
        @timelineUpdate="timelineUpdate"
        @playbackEnded="stopPlayback()"

        :server="GET_PLEX_SERVER"
        :src="GET_SRC_URL"
      ></videoplayer>

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

<style scoped>
  .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw) - 150px);
  }
  .is-fullscreen .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw));
  }
</style>

<script>
import axios from 'axios';
import { mapActions, mapGetters, mapState } from 'vuex';
import videoplayer from './ptplayer/videoplayer.vue';
import messages from '@/components/messages.vue';

import plexthumb from './plexbrowser/plexthumb.vue';

export default {
  name: 'ptplayer',
  components: {
    videoplayer, plexthumb, messages,
  },

  created() {
    this.FETCH_METADATA();
  },

  mounted() {
    console.log('UHHH PTPLAYER MOUNTED');
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

  data() {
    return {
      hovered: false,
      eventbus: window.EventBus,

      dialog: false,
      destroyed: false,

      lastSentTimeline: {},
    };
  },

  computed: {
    ...mapState(['manualSyncQueued', 'me']),
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
    ]),

    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
  },

  beforeDestroy() {
    this.destroyed = true;
  },

  methods: {
    ...mapActions('slplayer', [
      'FETCH_METADATA',
      'CHANGE_MAX_VIDEO_BITRATE',
      'CHANGE_AUDIO_STREAM',
      'CHANGE_SUBTITLE_STREAM',
      'CHANGE_MEDIA_INDEX',
    ]),

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

    timelineUpdate(data) {
      this.playertime = data.time;
      this.playerstatus = data.status;
      this.playerduration = data.duration;

      if (this.lastSentTimeline.state !== data.status || this.chosenKey !== this.lastSentTimeline.key) {
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
