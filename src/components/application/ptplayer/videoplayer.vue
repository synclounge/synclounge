<template>
  <div v-if="src" class="ptplayer">
    <videojs-player
      ref="videoPlayer"
      autoplay="true"
      controls="true"
      preload="auto"

      :initial-options="initialOptions"
      :src="[src]"

      @pause="onPlayerPause"
      @loadeddata="onPlayerLoadeddata"
      @ended="onPlayerEnded"
      @waiting="onPlayerWaiting"
      @playing="onPlayerPlaying"
      @timeupdate="sendTimelineUpdateEvent"
      @seeking="sendTimelineUpdateEvent"
      @seeked="sendTimelineUpdateEvent"
      @volumechange="volumeChange"
      @error="onPlayerError"


      @ready="playerReadied"
      style="background-color:transparent !important;"
      class="video-js"
>
    </videojs-player>
    <div class="center" v-if="!src">
      Waiting...
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['server', 'metadata', 'initialOffset', 'src', 'initUrl', 'stopUrl', 'params', 'sources'],
  created() {

  },
  data() {
    return {
      eventbus: window.EventBus,
      destroyed: false,
      offset: this.initialOffset,
      playerState: 'buffering',
      lastTime: 0,

      blockedSpeedChanges: false,
      ticker: null,

      initialOptions: {
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
    // Events from the parent component
    this.eventbus.$on('player-press-pause', (callback) => {
      if (this.playerState === 'paused') {
        return callback();
      }
      if (this.player) {
        this.player.pause();
      }
      return callback();
    });

    this.eventbus.$on('player-press-play', (callback) => {
      if (this.playerState === 'playing') {
        return callback();
      }
      if (this.player) {
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
        return callback(null, this.playerCurrentTime);
      } catch (e) {
        return callback(e, -1);
      }
    });
  },

  beforeDestroy() {
    this.destroyed = true;
    clearInterval(this.ticker);
    this.eventbus.$off('player-press-pause');
    this.eventbus.$off('player-press-play');
    this.eventbus.$off('player-seek');
    this.eventbus.$off('ptplayer-poll');

    const params = {
      hasMDE: 1,
      ratingKey: this.metadata.ratingKey,
      key: this.metadata.key,
      state: 'stopped',
      time: this.playerCurrentTime,
      duration: this.playerDuration,
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
    return axios.get(url);
  },

  computed: {
    player() {
      if (this.$refs && this.$refs.videoPlayer) {
        return this.$refs.videoPlayer.player;
      }

      return null;
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

    playerCurrentTime() {
      return this.player.currentTime() * 1000;
    },

    playerDuration() {
      return this.player.duration() * 1000;
    },
  },

  methods: {
    onPlayerPause() {
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
    seekMethod(data) {
      return new Promise((resolve, reject) => {
        const seekTo = data.time;
        // The parent will only ever send us this command if we are within 10s, lets change our playback speed to 3x to catch up
        let playbackSpeed = 1.0;
        let iterations = 0;
        if (!this.player.isReady_) {
          return reject(new Error('Player is not ready'));
        }
        try {
          if (!this.player || isNaN(this.player.currentTime())) {
            return reject(new Error('Player is not ready'));
          }
        } catch (e) {
          return reject(new Error(e));
        }
        let lastPlayerSpeed = this.player.playbackRate();
        let lastPlayerTime = this.player.currentTime() * 1000;
        if (seekTo < this.bufferEnd && seekTo > this.bufferStart) {
          this.player.currentTime(seekTo / 1000);
          return resolve(true);
        }
        if (data.soft) {
          return reject(new Error('Soft seek requested but not within buffered range'));
        }

        if (((Math.abs(seekTo - this.lastTime) < 3000) && (!this.blockedSpeedChanges) && (this.$store.state.synclounge.lastHostTimeline.playerState === 'playing'))) {
          const oldSources = this.player.options_.sources;
          let cancelled = false;
          window.EventBus.$once('host-playerstate-change', () => {
            cancelled = true;
          });
          const clicker = setInterval(() => {
            if (cancelled || !this.player || this.playerState === 'paused' || this.playerState === 'buffering' || oldSources !== this.player.options_.sources) {
              clearInterval(clicker);
              this.player.playbackRate(1.0);
              return reject(new Error('Slow seek was stop due to buffering or pausing'));
            }
            iterations++;
            try {
              if (!this.player || !this.player.currentTime() || !this.player.playbackRate()) {
                return;
              }
            } catch (e) {
              clearInterval(clicker);
              return reject(e);
            }
            if (lastPlayerSpeed === this.player.playbackRate()) {
              // Our played doesnt want to change it speed, lets swap to clean seek
              this.blockedSpeedChanges = true;
              reject(new Error('Failed to slow seek as the playback rate did not want to change'));
              return clearInterval(clicker);
            }
            if (this.playerState === 'paused' || (lastPlayerTime === this.player.currentTime() * 1000)) {
              return;
            }
            lastPlayerTime = this.player.currentTime * 1000;
            const slidingTime = seekTo + (25 * iterations);
            const current = Math.round(this.player.currentTime() * 1000);
            const difference = Math.abs(current - (slidingTime));
            if (current < slidingTime) {
            // Speed up
              playbackSpeed += 0.0001;
              if (this.player.playbackRate() < 1.02) {
                this.player.playbackRate(playbackSpeed);
              }
            }
            if (current > slidingTime) {
            // Slow down
              playbackSpeed -= 0.0001;
              if (this.player.playbackRate() > 0.98) {
                this.player.playbackRate(playbackSpeed);
              }
            }

            if (difference < 30) {
              this.player.playbackRate(1.0);
              resolve();
              clearInterval(clicker);
              return;
            }
            if (difference > 5000) {
              clearInterval(clicker);
              this.player.playbackRate(1.0);
              return reject(new Error('Slow seek was stopped as we are beyond 5000ms'));
            }
            lastPlayerSpeed = this.player.playbackSpeed();
          }, 25);
        } else {
          if (!this.player || !this.player.currentTime()) {
            return reject(new Error('Player is not initialized or does not have a current time'));
          }
          const oldTime = JSON.parse(JSON.stringify(this.lastTime));
          this.player.currentTime(seekTo / 1000);
          let ticks = 0;
          const ticker = setInterval(() => {
            if (!this.player || oldTime !== this.lastTime || (this.lastTime === (seekTo))) {
              clearInterval(ticker);
              return resolve('Directly seeked');
            }
            ticks++;
            if (ticks > 150) {
              clearInterval(ticker);
              return reject(new Error('Timed out'));
            }
          }, 100);
        }
      });
    },

    onPlayerLoadeddata() {
      return this.periodicPlexTimelineUpdate();
    },
    async periodicPlexTimelineUpdate() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.destroyed) {
          return Promise.resolve();
        }
        const delayPromise = this.delay(10000);
        // eslint-disable-next-line no-await-in-loop
        await this.sendPlexTimelineUpdate().catch(e => e);
        // eslint-disable-next-line no-await-in-loop
        await delayPromise;
      }
    },
    onPlayerPlaying() {
      this.playerState = 'playing';
    },
    onPlayerWaiting() {
      this.playerState = 'buffering';
      this.sendTimelineUpdateEvent();
    },
    volumeChange() {
      this.$store.commit('setSetting', ['PTPLAYERVOLUME', this.player.volume() || 0]);
    },
    playerReadied() {
      this.player.volume(this.$store.getters.getSettings.PTPLAYERVOLUME || 100);
      this.player.currentTime(this.initialOffset / 1000);
    },
    sendTimelineUpdateEvent() {
      this.$emit('timelineUpdate', {
        time: this.playerCurrentTime,
        duration: this.playerDuration,
        status: this.playerState,
      });
    },

    sendPlexTimelineUpdate() {
      if (!this || !this.player || !this.metadata) {
        clearInterval(this.ticker);
        return Promise.reject();
      }

      const params = {
        hasMDE: 1,
        ratingKey: this.metadata.ratingKey,
        key: this.metadata.key,
        state: this.playerState,
        time: this.playerCurrentTime,
        duration: this.playerDuration,
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
  },
};
</script>
