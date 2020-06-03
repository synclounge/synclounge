<template>
  <div style="width:100%; position: relative">
    <div style="position: relative" v-if="GET_METADATA">
      <div
        ref="videoPlayerContainer"
        class="slplayer"
        @bitratechanged="CHANGE_MAX_VIDEO_BITRATE($event.detail)"
      >
        <video
          ref="videoPlayer"
          autoplay="true"
          preload="auto"
          playsinline="true"

          @pause="HANDLE_PLAYER_PAUSE"
          @ended="DO_COMMAND_STOP"
          @waiting="HANDLE_PLAYER_WAITING"
          @playing="HANDLE_PLAYER_PLAYING"
          @seeking="HANDLE_PLAYER_SEEKING"
          @seeked="HANDLE_PLAYER_SEEKED"
          @volumechange="HANDLE_PLAYER_VOLUME_CHANGE"

          style="background-color:transparent !important;"
        >
        </video>
      </div>

      <div>
        <transition name="fade">
          <div v-show="ARE_PLAYER_CONTROLS_SHOWN">
            <v-layout row wrap style="position: absolute; top: 0; left: 0; z-index: 2" class="pa-3 hidden-xs-only">
              <img :src="GET_THUMB_URL" class="elevation-20" style="height: 80px; width: auto; vertical-align: middle; margin-left: auto; margin-right: auto;" />
              <v-flex class="pl-3">
                <v-container class="pa-0" fill-height>
                  <v-layout column wrap justify-space-apart>
                    <v-flex>
                      <h1>{{ GET_TITLE }}</h1>
                    </v-flex>

                    <v-flex>
                      <h3>{{ GET_SECONDARY_TITLE }}</h3>
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
                    <v-icon color="white" class="pl-3" v-on:click.native="DO_COMMAND_STOP">close</v-icon>
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
              :items="GET_QUALITIES"
              :value="GET_MAX_VIDEO_BITRATE"
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
              item-value="index"
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
                    <h3>{{ GET_SECONDARY_TITLE }}</h3>
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
                  <v-btn block color="error" v-on:click.native="DO_COMMAND_STOP">Stop playback</v-btn>
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
import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import slplayer from '@/store/modules/slplayer';

import messages from '@/components/messages.vue';
import plexthumb from './plexbrowser/plexthumb.vue';

import 'shaka-player/dist/controls.css';

import BitrateSelectionFactory from '@/player/ui/bitrateselection';

export default {
  name: 'slplayer',
  components: {
    plexthumb, messages,
  },

  data() {
    return {
      eventbus: window.EventBus,
      dialog: false,
      lastSentTimeline: {},
      metadataLoadedPromise: null,

      playerConfig: {
        streaming: {
          bufferingGoal: 120,
        },
      },

      playerUiOptions: {
        addBigPlayButton: false,
        controlPanelElements: [
          'time_and_duration',
          'spacer',
          'play_pause',
          'mute',
          'volume',
          'fullscreen',
          'overflow_menu',
        ],

        overflowMenuButtons: [
          'picture_in_picture',
          'cast',
          'bitrate',
        ],
      },
    };
  },

  beforeCreate() {
    if (!this.$store.state.slplayer) {
      this.$store.registerModule('slplayer', slplayer);
    }
  },

  created() {
    shaka.polyfill.installAll();
    this.metadataLoadedPromise = this.FETCH_METADATA();
    shaka.ui.OverflowMenu.registerElement('bitrate', new BitrateSelectionFactory(this.GET_QUALITIES, this.GET_MAX_VIDEO_BITRATE));
  },

  async mounted() {
    await this.metadataLoadedPromise;
    this.SET_PLAYER(new shaka.Player(this.$refs.videoPlayer));
    this.SET_PLAYER_CONFIGURATION(this.playerConfig);
    this.SET_PLAYER_UI(new shaka.ui.Overlay(this.GET_PLAYER, this.$refs.videoPlayerContainer, this.$refs.videoPlayer));
    this.SET_PLAYER_UI_CONFIGURATION(this.playerUiOptions);

    this.GET_PLAYER.addEventListener('loaded', this.HANDLE_PLAYER_MANIFEST_PARSED);

    this.onPlayerReady();


    // Similuate a real plex client
    this.eventbus.$on('command', this.HANDLE_COMMAND);
  },

  beforeDestroy() {
    this.eventbus.$off('command', this.HANDLE_COMMAND);
    this.DISPOSE_PLAYER();
    this.$store.unregisterModule('slplayer');
  },

  computed: {
    ...mapState(['manualSyncQueued', 'me']),
    ...mapGetters('slplayer', [
      'GET_METADATA',
      'GET_SUBTITLE_STREAMS',
      'GET_AUDIO_STREAMS',
      'GET_QUALITIES',
      'GET_MAX_VIDEO_BITRATE',
      'GET_AUDIO_STREAM_ID',
      'GET_SUBTITLE_STREAM_ID',
      'GET_MEDIA_LIST',
      'GET_MEDIA_INDEX',
      'GET_THUMB_URL',
      'GET_PLEX_SERVER',
      'GET_TITLE',
      'GET_SECONDARY_TITLE',
      'GET_PLAYER_STATE',
      'GET_OFFSET',
      'GET_PLAYER',
      'ARE_PLAYER_CONTROLS_SHOWN',
    ]),
  },

  watch: {
    GET_PLAYER_STATE(playerState) {
      if (playerState === 'stopped') {
        this.$router.push('/browse');
      }
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
      'PERIODIC_PLEX_TIMELINE_UPDATE_STARTER',
      'CHANGE_PLAYER_STATE',
      'HANDLE_PLAYER_PLAYING',
      'HANDLE_PLAYER_PAUSE',
      'HANDLE_PLAYER_SEEKING',
      'HANDLE_PLAYER_SEEKED',
      'HANDLE_PLAYER_WAITING',
      'HANDLE_PLAYER_VOLUME_CHANGE',
      'HANDLE_PLAYER_MANIFEST_PARSED',

      'HANDLE_COMMAND',
      'DO_COMMAND_STOP',
    ]),

    ...mapMutations('slplayer', [
      'SET_PLAYER',
      'SET_PLAYER_CONFIGURATION',
      'SET_PLAYER_UI',
      'SET_PLAYER_UI_CONFIGURATION',
      'DISPOSE_PLAYER',
    ]),

    async onPlayerReady() {
      await this.CHANGE_PLAYER_SRC();
      this.GET_PLAYER.volume = this.$store.getters.getSettings.PTPLAYERVOLUME || 100;
      return this.PERIODIC_PLEX_TIMELINE_UPDATE_STARTER();
    },

    doManualSync() {
      this.$store.commit('SET_VALUE', ['manualSyncQueued', true]);
    },
  },
};
</script>

<style scoped>
  .slplayer video {
    width: 100%;
    height: 100%;
  }
</style>

<style>
  .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw) - 150px);
  }
  .is-fullscreen .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw));
  }

  .slplayer span{
    color: black;
  }
</style>
