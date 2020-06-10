<template>
  <div style="width:100%; position: relative">
    <div
      v-if="GET_METADATA"
      style="position: relative"
    >
      <div
        ref="videoPlayerContainer"
        class="slplayer"
        @click="onClick"
      >
        <video
          ref="videoPlayer"
          autoplay
          preload="auto"
          playsinline="true"

          style="background-color:transparent !important;"
          @pause="HANDLE_PLAYER_PAUSE"
          @ended="DO_COMMAND_STOP"
          @playing="HANDLE_PLAYER_PLAYING"

          @volumechange="HANDLE_PLAYER_VOLUME_CHANGE"
        />
      </div>

      <div>
        <transition name="fade">
          <div v-show="ARE_PLAYER_CONTROLS_SHOWN">
            <v-layout
              row
              wrap
              style="position: absolute; top: 0; left: 0; z-index: 2"
              class="pa-3 hidden-xs-only"
            >
              <img
                :src="GET_THUMB_URL"
                class="elevation-20 plex-thumb"
              >
              <v-flex class="pl-3">
                <v-container
                  class="pa-0"
                  fill-height
                >
                  <v-layout
                    column
                    wrap
                    justify-space-apart
                  >
                    <v-flex>
                      <h1>{{ GET_TITLE }}</h1>
                    </v-flex>

                    <v-flex>
                      <h3>{{ GET_SECONDARY_TITLE }}</h3>
                    </v-flex>

                    <v-flex>
                      <h5>Playing from {{ GET_PLEX_SERVER.name }}</h5>
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
                  <v-tooltip
                    v-if="me && me.role !== 'host'"
                    bottom
                    color="accent"
                  >
                    <v-icon
                      slot="activator"
                      color="white"
                      class="clickable"
                      :disabled="manualSyncQueued"
                      @click="doManualSync"
                    >
                      compare_arrows
                    </v-icon>
                    Manual Sync
                  </v-tooltip>

                  <router-link
                    slot="activator"
                    to="/browse"
                  >
                    <v-icon
                      color="white"
                      class="pl-3"
                      @click.native="DO_COMMAND_STOP"
                    >
                      close
                    </v-icon>
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
              <v-flex xs12 />
            </v-layout>
          </div>
        </transition>
      </div>

      <div
        v-if="$vuetify.breakpoint.mdAndDown"
        class="messages-wrapper"
      >
        <messages />
      </div>

      <v-layout
        justify-center
        row
        class="pa-3 hidden-sm-and-up"
      >
        <v-flex xs12>
          <v-layout
            row
            wrap
          >
            <img
              :src="GET_THUMB_URL"
              class="elevation-20 plex-thumb"
            >
            <v-flex class="pl-2">
              <v-container
                class="pa-0"
                fill-height
              >
                <v-layout
                  column
                  wrap
                  justify-space-apart
                >
                  <v-flex>
                    <h1>{{ GET_TITLE }}</h1>
                  </v-flex>
                  <v-flex>
                    <h3>{{ GET_SECONDARY_TITLE }}</h3>
                  </v-flex>
                  <v-flex>
                    <h5>Playing from {{ GET_PLEX_SERVER.name }}</h5>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-flex>
            <v-layout
              row
              wrap
              class=""
            >
              <v-flex xs12>
                <v-btn
                  v-if="me.role !== 'host'"
                  block
                  :disabled="manualSyncQueued"
                  color="blue"
                  @click.native="doManualSync"
                >
                  Manual sync
                </v-btn>
              </v-flex>
              <v-flex xs12>
                <v-btn
                  block
                  color="primary"
                  @click.native="dialog = !dialog"
                >
                  Playback Settings
                </v-btn>
              </v-flex>
              <v-flex xs12>
                <router-link to="/browse">
                  <v-btn
                    block
                    color="error"
                    @click.native="DO_COMMAND_STOP"
                  >
                    Stop playback
                  </v-btn>
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
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';

import 'shaka-player/dist/controls.css';

import BitrateSelectionFactory from '@/player/ui/bitrateselection';
import SubtitleSelectionFactory from '@/player/ui/subtitleselection';
import AudioSelectionFactory from '@/player/ui/audioselection';
import MediaSelectionFactory from '@/player/ui/mediaselection';
import CloseButtonFactory from '@/player/ui/closebutton';
import Forward30ButtonFactory from '@/player/ui/forward30button';
import Replay10ButtonFactory from '@/player/ui/replay10button';

shaka.log.setLevel(shaka.log.Level.WARNING);
shaka.polyfill.installAll();

export default {
  name: 'Slplayer',
  data() {
    return {
      eventbus: window.EventBus,
      dialog: false,
      lastSentTimeline: {},
      metadataLoadedPromise: null,


      playerUiOptions: {
        controlPanelElements: [
          'replay10',
          'play_pause',
          'forward30',
          'mute',
          'volume',
          'close',
          'time_and_duration',
          'spacer',

          'overflow_menu',
          'fullscreen',
        ],

        overflowMenuButtons: [
          'picture_in_picture',
          'cast',
          'bitrate',
          'subtitle',
          'audio',
          'media',
        ],

        castReceiverAppId: 'CC1AD845',
      },
    };
  },

  computed: {
    ...mapState(['manualSyncQueued', 'me']),
    ...mapGetters('slplayer', [
      'GET_METADATA',
      'GET_SUBTITLE_STREAMS',
      'GET_AUDIO_STREAMS',
      'GET_QUALITIES',
      'GET_AUDIO_STREAM_ID',
      'GET_SUBTITLE_STREAM_ID',
      'GET_MEDIA_LIST',
      'GET_MEDIA_INDEX',
      'GET_THUMB_URL',
      'GET_PLEX_SERVER',
      'GET_TITLE',
      'GET_SECONDARY_TITLE',
      'GET_PLAYER_STATE',
      'GET_PLAYER',
      'ARE_PLAYER_CONTROLS_SHOWN',
      'GET_PLAYER_UI',
    ]),
    ...mapGetters('settings', [
      'GET_SLPLAYERQUALITY',
    ]),

    bigPlayButton() {
      // eslint-disable-next-line no-underscore-dangle
      return this.GET_PLAYER_UI.getControls().playButton_.button;
    },

    smallPlayButton() {
      // eslint-disable-next-line no-underscore-dangle
      return this.GET_PLAYER_UI.getControls().elements_
        .find((element) => element instanceof shaka.ui.SmallPlayButton).button;
    },
  },

  watch: {
    GET_PLAYER_STATE(playerState) {
      if (playerState === 'stopped') {
        this.$router.push('/browse');
      }
    },
  },

  created() {
    this.metadataLoadedPromise = this.FETCH_METADATA();
    shaka.ui.OverflowMenu.registerElement('bitrate', new BitrateSelectionFactory(this.eventbus));
    shaka.ui.OverflowMenu.registerElement('subtitle', new SubtitleSelectionFactory(this.eventbus));
    shaka.ui.OverflowMenu.registerElement('audio', new AudioSelectionFactory(this.eventbus));
    shaka.ui.OverflowMenu.registerElement('media', new MediaSelectionFactory(this.eventbus));
    shaka.ui.Controls.registerElement('close', new CloseButtonFactory(this.eventbus));
    shaka.ui.Controls.registerElement('forward30', new Forward30ButtonFactory());
    shaka.ui.Controls.registerElement('replay10', new Replay10ButtonFactory());
  },

  async mounted() {
    await this.metadataLoadedPromise;
    await this.ATTACH_PLAYER(this.$refs.videoPlayer);
    console.log('DONE ATTACH');
    this.SET_PLAYER_UI(new shaka.ui.Overlay(this.GET_PLAYER, this.$refs.videoPlayerContainer,
      this.$refs.videoPlayer));

    this.SET_PLAYER_UI_CONFIGURATION(this.playerUiOptions);

    this.bigPlayButton.addEventListener('click', this.onClick);
    this.smallPlayButton.addEventListener('click', this.onClick);

    this.eventbus.$on('subtitlestreamselectionchanged', this.CHANGE_SUBTITLE_STREAM);
    this.eventbus.$on('audiotreamselectionchanged', this.CHANGE_AUDIO_STREAM);
    this.eventbus.$on('mediaindexselectionchanged', this.CHANGE_MEDIA_INDEX);
    this.eventbus.$on('bitrateselectionchanged', this.CHANGE_MAX_VIDEO_BITRATE);
    this.eventbus.$on('playerclosebuttonclicked', this.DO_COMMAND_STOP);

    this.INIT_PLAYER_STATE();
    this.applyPlayerWatchers();
    // Similuate a real plex client
    this.eventbus.$on('command', this.HANDLE_COMMAND);

    window.addEventListener('keyup', this.onKeyUp);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyUp);
    this.bigPlayButton.removeEventListener('click', this.onClick);
    this.smallPlayButton.removeEventListener('click', this.onClick);
    this.eventbus.$off('command', this.HANDLE_COMMAND);
    this.eventbus.$off('subtitlestreamselectionchanged', this.CHANGE_SUBTITLE_STREAM);
    this.eventbus.$off('audiotreamselectionchanged', this.CHANGE_AUDIO_STREAM);
    this.eventbus.$off('mediaindexselectionchanged', this.CHANGE_MEDIA_INDEX);
    this.eventbus.$off('bitrateselectionchanged', this.CHANGE_MAX_VIDEO_BITRATE);
    this.eventbus.$off('playerclosebuttonclicked', this.DO_COMMAND_STOP);
    this.eventbus.$emit('slplayerdestroy');
    this.DESTROY_PLAYER_STATE();
  },

  methods: {
    ...mapActions('slplayer', [
      'FETCH_METADATA',
      'ATTACH_PLAYER',
      'CHANGE_MAX_VIDEO_BITRATE',
      'CHANGE_AUDIO_STREAM',
      'CHANGE_SUBTITLE_STREAM',
      'CHANGE_MEDIA_INDEX',
      'CHANGE_PLAYER_SRC',
      'HANDLE_PLAYER_PLAYING',
      'HANDLE_PLAYER_PAUSE',
      'HANDLE_PLAYER_VOLUME_CHANGE',

      'HANDLE_COMMAND',
      'DO_COMMAND_STOP',
      'INIT_PLAYER_STATE',
      'DESTROY_PLAYER_STATE',
      'PLAY_PAUSE_VIDEO',
      'SEND_PARTY_PLAY_PAUSE',
    ]),

    ...mapMutations('slplayer', [
      'SET_PLAYER_UI',
      'SET_PLAYER_UI_CONFIGURATION',
    ]),

    ...mapMutations('settings', [

    ]),

    doManualSync() {
      this.$store.commit('SET_VALUE', ['manualSyncQueued', true]);
    },

    applyPlayerWatchers() {
      this.$watch('GET_SUBTITLE_STREAMS', (newStreams) => {
        this.eventbus.$emit('subtitlestreamschanged', newStreams);
      }, {
        immediate: true,
      });

      this.$watch('GET_SUBTITLE_STREAM_ID', (newId) => {
        this.eventbus.$emit('subtitlestreamidchanged', newId);
      }, {
        immediate: true,
      });

      this.$watch('GET_AUDIO_STREAMS', (newStreams) => {
        this.eventbus.$emit('audiotreamschanged', newStreams);
      }, {
        immediate: true,
      });

      this.$watch('GET_AUDIO_STREAM_ID', (newId) => {
        this.eventbus.$emit('audiotreamidchanged', newId);
      }, {
        immediate: true,
      });

      this.$watch('GET_MEDIA_LIST', (newList) => {
        this.eventbus.$emit('medialistchanged', newList);
      }, {
        immediate: true,
      });

      this.$watch('GET_MEDIA_INDEX', (newIndex) => {
        this.eventbus.$emit('mediaindexchanged', newIndex);
      }, {
        immediate: true,
      });

      this.$watch('GET_QUALITIES', (newList) => {
        this.eventbus.$emit('bitrateschanged', newList);
      }, {
        immediate: true,
      });

      this.$watch('GET_SLPLAYERQUALITY', (newBitrate) => {
        this.eventbus.$emit('bitratechanged', newBitrate);
      }, {
        immediate: true,
      });
    },

    onKeyUp(event) {
      const { activeElement } = document;
      const isSeekBar = activeElement && activeElement.classList
        && activeElement.classList.contains('shaka-seek-bar');

      if (event.key === ' ' && activeElement.tagName !== 'INPUT'
        && activeElement.tagName !== 'BUTTON') {
        if (!isSeekBar) {
          // Make spacebar trigger play/pause in locations shaka normally doesn't
          this.PLAY_PAUSE_VIDEO();
        }

        this.SEND_PARTY_PLAY_PAUSE();
      }
    },

    onClick() {
      this.SEND_PARTY_PLAY_PAUSE();
    },
  },
};
</script>

<style scoped>
  .slplayer video {
    width: 100%;
    height: 100%;
  }

  .slplayer {
    height: calc(100vh - 64px);
  }

  @media screen and (max-width: 1264px) {
    div.slplayer {
      height: calc(0.5625 * 100vw);
    }
  }

  .hoverBar {
    position: absolute;
    background: -webkit-gradient(linear,left top,left bottom,from(rgba(0,0,0,.8)),
      color-stop(60%,rgba(0,0,0,.35)),to(transparent));
    background: linear-gradient(180deg,rgba(0,0,0,.8) 0,rgba(0,0,0,.35) 60%,transparent)
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.25s ease-out;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  .plex-thumb {
    height: 80px;
    width: auto;
    vertical-align: middle;
    margin-left: auto;
    margin-right: auto;
  }
</style>

<style>
  .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw) - 150px);
  }

  .is-fullscreen .messages-wrapper {
    height: calc(100vh - (0.5625 * 100vw));
  }

  /* Having to put shaka styling here since scoped rules don't seem to apply to them
    likely because its added dynamically */
  .slplayer span {
    color: black;
  }

  .shaka-slplayer-button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
