<template>
  <div v-if="src" class="ptplayer">
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

    <div class="center" v-if="!src">
      Waiting...
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import videojs from 'video.js';
import { mapGetters } from 'vuex';

export default {
  props: ['server', 'metadata', 'initialOffset', 'src', 'params'],
  data() {
    return {
      eventbus: window.EventBus,
      destroyed: false,
      offset: this.initialOffset,
      playerState: 'buffering',

      player: null,

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

  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.videoOptions, () => {
      this.onPlayerReady();
      this.applySrcWatcher();
    });
  },

  beforeDestroy() {
    this.destroyed = true;

    this.eventbus.$off('player-press-pause');
    this.eventbus.$off('player-press-play');
    this.eventbus.$off('player-seek');
    this.eventbus.$off('ptplayer-poll');

    const params = {
      hasMDE: 1,
      ratingKey: this.metadata.ratingKey,
      key: this.metadata.key,
      state: 'stopped',
      time: Math.floor(this.playerCurrentTimeMs()),
      duration: Math.floor(this.playerDurationMs()),
      'X-Plex-Product': this.params['X-Plex-Product'],
      'X-Plex-Version': this.params['X-Plex-Version'],
      'X-Plex-Client-Identifier': this.params['X-Plex-Client-Identifier'],
      'X-Plex-Platform': this.params['X-Plex-Platform'],
      'X-Plex-Platform-Version': this.params['X-Plex-Platform-Version'],
      'X-Plex-Device': this.params['X-Plex-Device'],
      'X-Plex-Device-Name': this.params['X-Plex-Device-Name'],
      'X-Plex-Device-Screen-Resolution': this.params['X-Plex-Device-Screen-Resolution'],
      'X-Plex-Token': this.params['X-Plex-Token'],
      'X-Plex-Session-Identifier': this.params['X-Plex-Session-Identifier'],
    };
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `${this.server.chosenConnection.uri}/:/timeline?${query}`;

    this.player = null;

    return axios.get(url);
  },

  computed: {
    ...mapGetters(['GET_HOST_PLAYER_STATE']),

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
    applySrcWatcher() {
      this.$watch('src', (newSrc) => {
        this.player.src([newSrc]);
      }, {
        deep: true,
        immediate: true,
      });
    },
    onPlayerReady() {
      this.player.volume(this.$store.getters.getSettings.PTPLAYERVOLUME || 100);
      this.player.currentTime(this.initialOffset / 1000);

      // Events from the parent component
      this.eventbus.$on('player-press-pause', (callback) => {
        if (this.playerState !== 'paused') {
          this.player.pause();
        }
        return callback();
      });

      this.eventbus.$on('player-press-play', (callback) => {
        if (this.playerState !== 'playing') {
          this.player.play();
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
      this.playerState = 'paused';
      this.sendTimelineUpdateEvent();
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
      this.playerState = 'buffering';
      this.sendTimelineUpdateEvent();
    },

    onPlayerSeeked() {
      console.log('Seeked');
      this.playerState = this.player.paused() ? 'paused' : 'playing';
      this.sendTimelineUpdateEvent();
    },

    onPlayerTimeUpdate() {
      if (!this.destroyed) {
        this.sendTimelineUpdateEvent();
      }
    },

    onPlayerPlaying() {
      console.log('playing');
      this.playerState = 'playing';
    },

    onPlayerWaiting() {
      console.log('WAITINGGGG');
      this.playerState = 'buffering';
      this.sendTimelineUpdateEvent();
    },

    onPlayerVolumeChange() {
      this.$store.commit('setSetting', ['PTPLAYERVOLUME', this.player.volume() || 0]);
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
        await this.sendPlexTimelineUpdate().catch(e => e);
        // eslint-disable-next-line no-await-in-loop
        await delayPromise;
      }
    },

    isTimeInBufferedRange(time) {
      const bufferedTimeRange = this.player.buffered();

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

      this.player.currentTime(seekToMs / 1000);
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
        this.player.one('seeked', (e) => {
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
          if (cancelled || this.playerState !== 'playing') {
            this.player.playbackRate(1.0);
            throw new Error('Slow seek was stop due to buffering or pausing');
          }

          const delayPromise = this.delay(25);

          // 25 here because interval is 25ms
          const expectedHostTimeMs = seekToMs + (25 * iterations);

          const difference = expectedHostTimeMs - this.playerCurrentTimeMs();
          const absDifference = Math.abs(difference);

          if (absDifference < 30) {
            this.player.playbackRate(1.0);
            return true;
          }

          if (absDifference > 5000) {
            this.player.playbackRate(1.0);
            throw new Error('Slow seek was stopped as we are beyond 5000ms');
          }

          if (difference > 0) {
            if (this / player.playbackRate() < 1.02) {
              // Speed up
              this.player.playbackRate(this.player.playbackRate() + 0.0001);
            }
          } else if (this.player.playbackRate() > 0.98) {
            // Slow down
            this.player.playbackRate(this.player.playbackRate() - 0.0001);
          }

          // eslint-disable-next-line no-await-in-loop
          await delayPromise;

          iterations += 1;
        }
      } else {
        this.player.currentTime(seekToMs / 1000);
        return this.promiseWithTimeout(this.seekedPromise(), 15000);
      }
    },

    sendTimelineUpdateEvent() {
      this.$emit('timelineUpdate', {
        time: this.playerCurrentTimeMs(),
        duration: this.playerDurationMs(),
        status: this.playerState,
      });
    },

    sendPlexTimelineUpdate() {
      const params = {
        hasMDE: 1,
        ratingKey: this.metadata.ratingKey,
        key: this.metadata.key,
        state: this.playerState,
        time: Math.floor(this.playerCurrentTimeMs()),
        duration: Math.floor(this.playerDurationMs()),
        'X-Plex-Product': this.params['X-Plex-Product'],
        'X-Plex-Version': this.params['X-Plex-Version'],
        'X-Plex-Client-Identifier': this.params['X-Plex-Client-Identifier'],
        'X-Plex-Platform': this.params['X-Plex-Platform'],
        'X-Plex-Platform-Version': this.params['X-Plex-Platform-Version'],
        'X-Plex-Device': this.params['X-Plex-Device'],
        'X-Plex-Device-Name': this.params['X-Plex-Device-Name'],
        'X-Plex-Device-Screen-Resolution': this.params['X-Plex-Device-Screen-Resolution'],
        'X-Plex-Token': this.params['X-Plex-Token'],
        'X-Plex-Session-Identifier': this.params['X-Plex-Session-Identifier'],
      };

      const query = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const url = `${this.server.chosenConnection.uri}/:/timeline?${query}`;
      return axios.get(url, { timeout: 10000 });
    },

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    playerCurrentTimeMs() {
      return this.player.currentTime() * 1000;
    },

    playerDurationMs() {
      return this.player.duration() * 1000;
    },
  },
};
</script>

<style src="video.js/dist/video-js.css">
</style>
