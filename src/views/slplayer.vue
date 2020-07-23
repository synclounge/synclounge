<template>
  <v-row
    style="position: relative"
    class="slplayer-container"
  >
    <v-col class="pa-0">
      <div
        ref="videoPlayerContainer"
        class="slplayer"
        @click="HANDLE_PLAYER_CLICK"
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
        transition="fade-transition"
      >
        <v-row
          v-show="ARE_PLAYER_CONTROLS_SHOWN"
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
              color="blue"
              @click="MANUAL_SYNC"
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

import { mapActions, mapGetters, mapMutations } from 'vuex';
import sizing from '@/mixins/sizing';
import initialize from '@/player/init';

import 'shaka-player/dist/controls.css';

export default {
  components: {
    messages: () => import('@/components/messaging/messages.vue'),
    MessageInput: () => import('@/components/messaging/MessageInput.vue'),
  },

  mixins: [
    sizing,
  ],

  data() {
    return {
      playerConfig: {
        streaming: {
          // TODO: make this config
          bufferingGoal: 120,

          retryParameters: {
            timeout: 0, // timeout in ms, after which we abort; 0 means never
            maxAttempts: 9999, // the maximum number of requests before we fail
            baseDelay: 1000, // the base delay in ms between retries
            backoffFactor: 2, // the multiplicative backoff factor between retries
            fuzzFactor: 0.5, // the fuzz factor to apply to each retry delay
          },
        },

        manifest: {
          retryParameters: {
            timeout: 0, // timeout in ms, after which we abort; 0 means never
            maxAttempts: 9999, // the maximum number of requests before we fail
            baseDelay: 1000, // the base delay in ms between retries
            backoffFactor: 2, // the multiplicative backoff factor between retries
            fuzzFactor: 0.5, // the fuzz factor to apply to each retry delay
          },
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
      'ARE_PLAYER_CONTROLS_SHOWN',
      'GET_PLAYER_STATE',
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
  },

  watch: {
    GET_PLAYER_STATE(state) {
      if (state === 'stopped') {
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

  async mounted() {
    // TODO: monitor upnext stuff interval probably or idk state change timeugh

    await initialize({
      mediaElement: this.$refs.videoPlayer,
      playerConfig: this.playerConfig,
      videoContainer: this.$refs.videoPlayerContainer,
      overlayConfig: this.getPlayerUiOptions(),
    });

    await this.INIT_PLAYER_STATE();

    window.addEventListener('keyup', this.onKeyUp);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyUp);
    this.DESTROY_PLAYER_STATE();
  },

  methods: {
    ...mapActions('slplayer', [
      'CHANGE_MEDIA_INDEX',
      'CHANGE_PLAYER_SRC',
      'HANDLE_PLAYER_PLAYING',
      'HANDLE_PLAYER_PAUSE',
      'HANDLE_PLAYER_VOLUME_CHANGE',
      'HANDLE_PLAYER_CLICK',

      'PRESS_STOP',
      'INIT_PLAYER_STATE',
      'DESTROY_PLAYER_STATE',
      'PLAY_PAUSE_VIDEO',
      'SEND_PARTY_PLAY_PAUSE',
    ]),

    ...mapMutations([
      'SET_BACKGROUND',
    ]),

    ...mapActions('synclounge', [
      'MANUAL_SYNC',
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
          'manual_sync',

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
