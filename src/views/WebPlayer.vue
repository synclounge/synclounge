<template>
  <v-row
    style="position: relative;"
    class="ma-n3"
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
          class="black"

          @pause="HANDLE_PLAYER_PAUSE"
          @ended="PRESS_STOP"
          @playing="HANDLE_PLAYER_PLAYING"
          @seeking="HANDLE_SEEKING"
          @seeked="HANDLE_SEEKED"
          @volumechange="HANDLE_PLAYER_VOLUME_CHANGE"
          @enterpictureinpicture="HANDLE_PICTURE_IN_PICTURE_CHANGE"
          @leavepictureinpicture="HANDLE_PICTURE_IN_PICTURE_CHANGE"
          @timeupdate="handleTimeUpdate"
        />

        <v-fade-transition
          transition="fade-transition"
        >
          <v-btn
            v-show="shouldShowSkipIntroButton"
            absolute
            bottom
            right
            large
            class="skip-intro"
            :style="skipIntroButtonStyle"
            @click="SKIP_INTRO"
          >
            Skip Intro
          </v-btn>
        </v-fade-transition>
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
                      <v-col class="text-subtitle-2 primary--text">
                        Playing from {{ GET_PLEX_SERVER.name }}
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
        <MessageList class="messages-wrapper" />
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
                <v-col class="text-subtitle-2 primary--text">
                  Playing from {{ GET_PLEX_SERVER.name }}
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

import { mapActions, mapGetters, mapState } from 'vuex';

import initialize from '@/player/init';
import { getControlsOffset } from '@/player';
import linkWithRoom from '@/mixins/linkwithroom';

import 'shaka-player/dist/controls.css';
import 'synclounge-libjass/lib/libjass.css';

export default {
  name: 'WebPlayer',

  components: {
    MessageList: () => import('@/components/MessageList.vue'),
    MessageInput: () => import('@/components/MessageInput.vue'),
  },

  mixins: [
    linkWithRoom,
  ],

  data: () => ({
    videoTimeStamp: 0,
    controlsOffset: 0,
  }),

  computed: {
    ...mapGetters('slplayer', [
      'GET_THUMB_URL',
      'GET_PLEX_SERVER',
      'GET_TITLE',
      'GET_SECONDARY_TITLE',
      'ARE_PLAYER_CONTROLS_SHOWN',
      'GET_PLAYER_STATE',
      'IS_USING_NATIVE_SUBTITLES',
    ]),

    ...mapGetters('synclounge', [
      'AM_I_HOST',
    ]),

    ...mapGetters('plexclients', [
      'GET_ACTIVE_MEDIA_METADATA',
      'GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER',
    ]),

    ...mapGetters('settings', [
      'GET_AUTO_SKIP_INTRO',
    ]),

    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapState('slplayer', [
      'forceBurnSubtitles',
    ]),

    playerConfig() {
      return {
        streaming: {
          bufferingGoal: this.GET_CONFIG.slplayer_buffering_goal,
        },
      };
    },

    skipIntroButtonStyle() {
      return {
        'margin-bottom': `${this.controlsOffset + 12}px`,
      };
    },

    isInIntro() {
      return this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER
        && this.videoTimeStamp >= this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER.startTimeOffset
        && this.videoTimeStamp < this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER.endTimeOffset;
    },

    isInInitialIntroRegion() {
      return this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER
        && this.videoTimeStamp >= this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER.startTimeOffset
        && this.videoTimeStamp - this.GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER.startTimeOffset
          < this.GET_CONFIG.slplayer_initial_skip_intro_visible_period;
    },

    shouldShowSkipIntroButton() {
      return this.AM_I_HOST && this.isInIntro && (this.ARE_PLAYER_CONTROLS_SHOWN
      || this.isInInitialIntroRegion);
    },
  },

  watch: {
    GET_PLAYER_STATE(state) {
      if (state === 'stopped') {
        this.$router.push(this.linkWithRoom({ name: 'PlexHome' }));
      }
    },

    GET_ACTIVE_MEDIA_METADATA: {
      async handler(newMetadata) {
        // This handles regular plex clients (nonslplayer) playback changes
        if (newMetadata) {
          await this.SET_MEDIA_AS_BACKGROUND(newMetadata);
        }
      },
      immediate: true,
    },

    ARE_PLAYER_CONTROLS_SHOWN() {
      return this.RERENDER_SUBTITLE_CONTAINER();
    },

    isInIntro: {
      handler() {
        return this.checkAutoSkipIntro();
      },
      immediate: true,
    },

    GET_AUTO_SKIP_INTRO: {
      handler() {
        return this.checkAutoSkipIntro();
      },
      immediate: true,
    },

    async forceBurnSubtitles(forceBurn) {
      if (forceBurn && this.IS_USING_NATIVE_SUBTITLES) {
        await this.UPDATE_PLAYER_SRC_AND_KEEP_TIME();
      }
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
    window.addEventListener('resize', this.RERENDER_SUBTITLE_CONTAINER);
    this.controlsOffset = getControlsOffset(this.$refs?.videoPlayerContainer?.offsetHeight);
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.RERENDER_SUBTITLE_CONTAINER);
    this.DESTROY_PLAYER_STATE();
  },

  methods: {
    ...mapActions('plexservers', [
      'SET_MEDIA_AS_BACKGROUND',
    ]),

    ...mapActions('slplayer', [
      'CHANGE_MEDIA_INDEX',
      'CHANGE_PLAYER_SRC',
      'HANDLE_PLAYER_PLAYING',
      'HANDLE_PLAYER_PAUSE',
      'HANDLE_PLAYER_VOLUME_CHANGE',
      'HANDLE_PLAYER_CLICK',
      'HANDLE_SEEKING',
      'HANDLE_SEEKED',
      'HANDLE_PICTURE_IN_PICTURE_CHANGE',

      'PRESS_STOP',
      'INIT_PLAYER_STATE',
      'DESTROY_PLAYER_STATE',
      'PLAY_PAUSE_VIDEO',
      'SEND_PARTY_PLAY_PAUSE',
      'SKIP_INTRO',
      'RERENDER_SUBTITLE_CONTAINER',
      'UPDATE_PLAYER_SRC_AND_KEEP_TIME',
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
          'media',
          'bitrate',
          'audio',

          'subtitle',
          'subtitleoffset',
          'subtitlesize',
          'subtitleposition',
          'subtitlecolor',

          'cast',
          'picture_in_picture',
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

    handleTimeUpdate() {
      this.videoTimeStamp = (this.$refs?.videoPlayer?.currentTime ?? 0) * 1000;
    },

    async checkAutoSkipIntro() {
      if (this.isInIntro && this.GET_AUTO_SKIP_INTRO) {
        await this.SKIP_INTRO();
      }
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
  background:
    -webkit-gradient(
      linear,
      left top,
      left bottom,
      from(rgb(0 0 0 / 80%)),
      color-stop(60%, rgb(0 0 0 / 35%)),
      to(transparent)
    );
  background: linear-gradient(180deg, rgb(0 0 0 / 80%) 0, rgb(0 0 0 / 35%) 60%, transparent);
  top: 0;
  left: 0;
  width: 100%;
}

.plex-thumb {
  height: 80px;
  width: auto;
  vertical-align: middle;
  margin-left: auto;
  margin-right: auto;
}

.v-btn.skip-intro {
  z-index: 2;
}

.v-btn.skip-intro.fade-transition-leave-active {
  transition-duration: 0.6s !important;
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

.libjass-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
