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

      <v-fade-transition
        v-show="ARE_PLAYER_CONTROLS_SHOWN"
        transition="fade-transition"
      >
        <v-row
          no-gutters
          class="pa-3 hidden-xs-only hoverBar"
        >
          <v-col>
            <v-container fluid>
              <v-row no-gutters>
                <v-col cols="auto">
                  <v-img
                    contain
                    :src="GET_THUMB_URL"
                    class="plex-thumb"
                  />
                </v-col>

                <v-col class="pl-3">
                  <v-container
                    fluid
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
            </v-container>
          </v-col>

          <v-col cols="auto">
            <v-tooltip
              v-if="!AM_I_HOST"
              bottom
              color="accent"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                  color="white"
                  class="clickable"
                  :disabled="IS_MANUAL_SYNC_QUEUED"
                  v-bind="attrs"
                  @click="SET_IS_MANUAL_SYNC_QUEUED(true)"
                  v-on="on"
                >
                  compare_arrows
                </v-icon>
              </template>

              <span>Manual Sync</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-fade-transition>

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
              :disabled="IS_MANUAL_SYNC_QUEUED"
              color="blue"
              @click="SET_IS_MANUAL_SYNC_QUEUED(true)"
            >
              Manual sync
            </v-btn>
          </v-col>

          <v-col>
            <v-btn
              block
              color="error"
              @click="PRESS_STOP"
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
import { mapActions, mapGetters, mapMutations } from 'vuex';
import sizing from '@/mixins/sizing';

import 'shaka-player/dist/controls.css';
import '@/player/ui';

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
      playerConfig: {
        streaming: {
          bufferingGoal: 120,
        },
      },

    };
  },

  computed: {
    ...mapGetters('slplayer', [
      'GET_THUMB_URL',
      'GET_PLEX_SERVER',
      'GET_TITLE',
      'GET_SECONDARY_TITLE',
      'GET_PLAYER',
      'ARE_PLAYER_CONTROLS_SHOWN',
      'GET_PLAYER_UI',
      'GET_PLAYER_STATE',
    ]),

    ...mapGetters('synclounge', [
      'AM_I_HOST',
      'IS_MANUAL_SYNC_QUEUED',
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
    GET_PLAYER_STATE(playerState) {
      if (playerState === 'stopped') {
        this.$router.push({ name: 'browse' });
      }
    },

    GET_ACTIVE_MEDIA_METADATA: {
      handler(newMetadata) {
        // This handles regular plex clients (nonslplayer) playback changes
        if (newMetadata) {
          this.setBackground(newMetadata);
        }
      },
      immediate: true,
    },
  },

  mounted() {
    this.SET_PLAYER(new shaka.Player(this.$refs.videoPlayer));
    this.SET_PLAYER_CONFIGURATION(this.playerConfig);
    this.SET_PLAYER_UI(new shaka.ui.Overlay(this.GET_PLAYER, this.$refs.videoPlayerContainer,
      this.$refs.videoPlayer));

    this.SET_PLAYER_UI_CONFIGURATION(this.getPlayerUiOptions());

    this.bigPlayButton.addEventListener('click', this.onClick);
    this.smallPlayButton.addEventListener('click', this.onClick);

    this.INIT_PLAYER_STATE();

    window.addEventListener('keyup', this.onKeyUp);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyUp);
    this.bigPlayButton.removeEventListener('click', this.onClick);
    this.smallPlayButton.removeEventListener('click', this.onClick);
    this.DESTROY_PLAYER_STATE();
  },

  methods: {
    ...mapActions('slplayer', [
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

    ...mapMutations('synclounge', [
      'SET_IS_MANUAL_SYNC_QUEUED',
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
          'mute',
          'volume',
          'time_and_duration',

          'spacer',

          'previous',
          'replay10',
          'play_pause',
          'forward30',
          'next',
          'close',

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
    background: linear-gradient(180deg,rgba(0,0,0,.8) 0,rgba(0,0,0,.35) 60%,transparent);
    top: 0;
    left: 0;
    width: 100%;
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

  .shaka-slplayer-button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .shaka-play-button {
    padding: 50px !important;
  }

  .shaka-spinner {
    padding: 57px !important;
  }
</style>
