<template>
  <v-row
    style="position: relative"
    class="slplayer-container"
  >
    <v-col class="pa-0">
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
          @ended="PRESS_STOP"
          @playing="HANDLE_PLAYER_PLAYING"

          @volumechange="HANDLE_PLAYER_VOLUME_CHANGE"
        />
      </div>

      <div>
        <transition name="fade">
          <div v-show="ARE_PLAYER_CONTROLS_SHOWN">
            <v-row
              style="position: absolute; top: 0; left: 0; z-index: 2"
              class="pa-3 hidden-xs-only"
            >
              <v-col cols="auto">
                <v-img
                  contain
                  :src="GET_THUMB_URL"
                  class="plex-thumb"
                />
              </v-col>

              <v-col class="pl-3">
                <v-container
                  class="pa-0"
                  fill-height
                >
                  <v-row no-gutters>
                    <v-col>
                      <h1>{{ GET_TITLE }}</h1>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col>
                      <h3>{{ GET_SECONDARY_TITLE }}</h3>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col>
                      <h5>Playing from {{ GET_PLEX_SERVER.name }}</h5>
                    </v-col>
                  </v-row>
                </v-container>
              </v-col>
            </v-row>

            <v-row
              style="position: absolute; top: 0; right: 0; z-index: 2"
              class="pa-3 hidden-xs-only"
            >
              <v-col class="text-xs-right pa-1">
                <div class="hidden-xs-only">
                  <v-tooltip
                    v-if="!AM_I_HOST"
                    bottom
                    color="accent"
                  >
                    <v-icon
                      color="white"
                      class="clickable"
                      :disabled="manualSyncQueued"
                      @click="doManualSync"
                    >
                      compare_arrows
                    </v-icon>
                    Manual Sync
                  </v-tooltip>

                  <v-icon
                    color="white"
                    class="pl-3"
                    @click="PRESS_STOP"
                  >
                    close
                  </v-icon>
                </div>
              </v-col>
            </v-row>

            <v-row
              class="hoverBar"
              style="height: 120px; width: 100%; pointer-events: none; position: absolute; top: 0;"
            >
              <v-col xs12 />
            </v-row>
          </div>
        </transition>
      </div>

      <div
        v-if="$vuetify.breakpoint.mdAndDown"
      >
        <messages class="messages-wrapper" />
        <MessageInput />
      </div>

      <div class="hidden-sm-and-up">
        <v-row
          justify="center"
          class="pa-3"
        >
          <v-col cols="auto">
            <v-img
              contain
              :src="GET_THUMB_URL"
              class="plex-thumb"
            />
          </v-col>

          <v-col class="pl-2">
            <v-container
              class="pa-0"
              fill-height
            >
              <v-row no-gutters>
                <v-col>
                  <h1>{{ GET_TITLE }}</h1>
                </v-col>
              </v-row>

              <v-row no-gutters>
                <v-col>
                  <h3>{{ GET_SECONDARY_TITLE }}</h3>
                </v-col>
              </v-row>

              <v-row no-gutters>
                <v-col>
                  <h5>Playing from {{ GET_PLEX_SERVER.name }}</h5>
                </v-col>
              </v-row>
            </v-container>
          </v-col>
        </v-row>

        <v-row>
          <v-col v-if="!AM_I_HOST">
            <v-btn
              block
              :disabled="manualSyncQueued"
              color="blue"
              @click.native="doManualSync"
            >
              Manual sync
            </v-btn>
          </v-col>

          <v-col>
            <v-btn
              block
              color="primary"
              @click.native="dialog = !dialog"
            >
              Playback Settings
            </v-btn>
          </v-col>

          <v-col>
            <v-btn
              block
              color="error"
              @click.native="DO_COMMAND_STOP"
            >
              Stop playback
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import sizing from '@/mixins/sizing';

import 'shaka-player/dist/controls.css';

import BitrateSelectionFactory from '@/player/ui/bitrateselection';
import SubtitleSelectionFactory from '@/player/ui/subtitleselection';
import AudioSelectionFactory from '@/player/ui/audioselection';
import MediaSelectionFactory from '@/player/ui/mediaselection';
import CloseButtonFactory from '@/player/ui/closebutton';
import Forward30ButtonFactory from '@/player/ui/forward30button';
import Replay10ButtonFactory from '@/player/ui/replay10button';

shaka.log.setLevel(shaka.log.Level.ERROR);
shaka.polyfill.installAll();

export default {
  name: 'Slplayer',

  components: {
    messages: () => import('@/components/messages.vue'),
    MessageInput: () => import('@/components/MessageInput.vue'),
  },

  mixins: [
    sizing,
  ],

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

    };
  },

  computed: {
    ...mapState(['manualSyncQueued']),

    ...mapGetters('slplayer', [
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
      'GET_PLAYER',
      'ARE_PLAYER_CONTROLS_SHOWN',
      'GET_PLAYER_UI',
    ]),

    ...mapGetters('settings', [
      'GET_SLPLAYERQUALITY',
    ]),

    ...mapGetters('synclounge', [
      'AM_I_HOST',
    ]),

    ...mapGetters('plexclients', [
      'GET_ACTIVE_MEDIA_METADATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
    ]),

    bigPlayButton() {
      window.player = this.GET_PLAYER;
      window.playerUi = this.GET_PLAYER_UI;
      // eslint-disable-next-line no-underscore-dangle
      return this.GET_PLAYER_UI.controls_.playButton_.button;
    },

    smallPlayButton() {
      // eslint-disable-next-line no-underscore-dangle
      return this.GET_PLAYER_UI.getControls().elements_
        .find((element) => element instanceof shaka.ui.SmallPlayButton).button;
    },
  },

  watch: {
    GET_ACTIVE_MEDIA_METADATA: {
      handler(newMetadata) {
        // This handles regular plex clients (nonslplayer) playback changes
        if (newMetadata) {
          this.setBackground(newMetadata);
        } else {
          this.$router.push('/browse');
        }
      },
      immediate: true,
    },
  },

  created() {
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
    this.SET_PLAYER(new shaka.Player(this.$refs.videoPlayer));
    this.SET_PLAYER_CONFIGURATION(this.playerConfig);
    this.SET_PLAYER_UI(new shaka.ui.Overlay(this.GET_PLAYER, this.$refs.videoPlayerContainer,
      this.$refs.videoPlayer));

    this.SET_PLAYER_UI_CONFIGURATION(this.getPlayerUiOptions());

    this.bigPlayButton.addEventListener('click', this.onClick);
    this.smallPlayButton.addEventListener('click', this.onClick);

    this.eventbus.$on('subtitlestreamselectionchanged', this.CHANGE_SUBTITLE_STREAM);
    this.eventbus.$on('audiotreamselectionchanged', this.CHANGE_AUDIO_STREAM);
    this.eventbus.$on('mediaindexselectionchanged', this.CHANGE_MEDIA_INDEX);
    this.eventbus.$on('bitrateselectionchanged', this.CHANGE_MAX_VIDEO_BITRATE);
    this.eventbus.$on('playerclosebuttonclicked', this.PRESS_STOP);

    this.INIT_PLAYER_STATE();
    this.applyPlayerWatchers();

    window.addEventListener('keyup', this.onKeyUp);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyUp);
    this.bigPlayButton.removeEventListener('click', this.onClick);
    this.smallPlayButton.removeEventListener('click', this.onClick);
    this.eventbus.$off('subtitlestreamselectionchanged', this.CHANGE_SUBTITLE_STREAM);
    this.eventbus.$off('audiotreamselectionchanged', this.CHANGE_AUDIO_STREAM);
    this.eventbus.$off('mediaindexselectionchanged', this.CHANGE_MEDIA_INDEX);
    this.eventbus.$off('bitrateselectionchanged', this.CHANGE_MAX_VIDEO_BITRATE);
    this.eventbus.$off('playerclosebuttonclicked', this.PRESS_STOP);
    this.eventbus.$emit('slplayerdestroy');
    this.DESTROY_PLAYER_STATE();
  },

  methods: {
    ...mapActions('slplayer', [
      'CHANGE_MAX_VIDEO_BITRATE',
      'CHANGE_AUDIO_STREAM',
      'CHANGE_SUBTITLE_STREAM',
      'CHANGE_MEDIA_INDEX',
      'CHANGE_PLAYER_SRC',
      'HANDLE_PLAYER_PLAYING',
      'HANDLE_PLAYER_PAUSE',
      'HANDLE_PLAYER_VOLUME_CHANGE',

      'PRESS_STOP',
      'INIT_PLAYER_STATE',
      'DESTROY_PLAYER_STATE',
      'PLAY_PAUSE_VIDEO',
      'SEND_PARTY_PLAY_PAUSE',
    ]),

    ...mapMutations('slplayer', [
      'SET_PLAYER_UI',
      'SET_PLAYER_UI_CONFIGURATION',
      'SET_PLAYER',
      'SET_PLAYER_CONFIGURATION',
    ]),

    ...mapMutations([
      'SET_BACKGROUND',
    ]),

    getCastReceiverId() {
      return window.chrome && window.chrome.cast && window.chrome.cast.media
        ? window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
        : '';
    },

    // This is an action so it's not cached because chromecast stuff loads late
    getPlayerUiOptions() {
      return {
        addBigPlayButton: true,
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

        castReceiverAppId: this.getCastReceiverId(),
      };
    },

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

    onClick(e) {
      if (!e.target.classList.contains('shaka-close-button')) {
        this.SEND_PARTY_PLAY_PAUSE();
      }
    },

    setBackground(metadata) {
      this.SET_BACKGROUND(
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: metadata.machineIdentifier,
          mediaUrl: metadata.art,
          width: this.getAppWidth() / 4,
          height: this.getAppHeight() / 4,
          blur: 2,
        }),
      );
    },
  },
};
</script>

<style scoped>
  .slplayer-container {
    margin-top: -12px;
    margin-bottom: -12px;
  }

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
    max-height: calc(100vh - (0.5625 * 100vw) - 150px);
    overflow: scroll;
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
