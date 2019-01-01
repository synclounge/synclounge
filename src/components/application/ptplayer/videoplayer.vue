<template>
  <div v-if="source && initReqSent">
    <video-player
      ref="videoPlayer"
      :options="playerOptions"

      @play="onPlayerPlay($event)"
      @pause="onPlayerPause($event)"
      @loadeddata="onPlayerLoadeddata($event)"
      @ended="onPlayerEnded($event)"
      @waiting="onPlayerWaiting($event)"
      @playing="onPlayerPlaying($event)"
      @timeupdate="onPlayerTimeupdate($event)"
      @canplay.once="onPlayerCanplay($event)"
      @canplaythrough="onPlayerCanplaythrough($event)"
      @seeking="onPlayerSeeking($event)"
      @seeked="onPlayerSeeked($event)"
      @statechanged="playerStateChanged($event)"

      @ready="playerReadied"
      style="background-color:transparent !important;"
      class="ptplayer"
      :class="ptplayerClass"
>
    </video-player>
    <div class="center" v-if="!src">
      Waiting...
    </div>
  </div>
</template>

<script>
const request = require('request');

export default {
  props: ['server', 'metadata', 'initialOffset', 'src', 'initUrl', 'stopUrl', 'params', 'sources'],
  created() {

  },
  data() {
    return {
      eventbus: window.EventBus,

      offset: this.initialOffset,
      initReqSent: false,
      source: null,

      isPlaying: 'buffering',
      lastTime: 0,
      duration: 0,
      bufferedTill: 0,

      decisionResult: null,
      blockedSpeedChanges: false,
      ticker: null,

      playbackRate: 1,
    };
  },
  mounted() {
    this.source = this.src;
    this.initReqSent = true;
    this.$emit('playerMounted');

    // Events from the parent component
    this.eventbus.$on('player-press-pause', (callback) => {
      if (this.isPlaying === 'paused') {
        return callback();
      }
      if (this.player) {
        this.player.pause();
      }
      return callback();
    });

    this.eventbus.$on('player-press-play', (callback) => {
      if (this.isPlaying === 'playing') {
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
        callback(null, this.player.currentTime() * 1000);
      } catch (e) {
        return callback(e, -1);
      }
    });
  },
  beforeDestroy() {
    clearInterval(this.ticker);
    this.eventbus.$off('player-press-pause');
    this.eventbus.$off('player-press-play');
    this.eventbus.$off('player-seek');
    this.eventbus.$off('ptplayer-poll');

    let query = '';
    const params = {
      hasMDE: 1,
      ratingKey: this.metadata.ratingKey,
      key: this.metadata.key,
      state: 'stopped',
      time: this.lastTime,
      duration: Math.round(this.player.duration() * 1000),
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
    for (const key in params) {
      query += `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`;
    }
    const url = `${this.server.chosenConnection.uri}/:/timeline?${query}`;
    request(url, (error, response, body) => {
      if (!error) {
        // console.log('Succesfully sent Player status to PMS')
      }
    });
  },
  computed: {
    player() {
      if (this.$refs && this.$refs.videoPlayer) {
        return this.$refs.videoPlayer.player;
      }
    },

    ptplayerClass() {
      const breakpoint = this.$vuetify.breakpoint.name;
      return breakpoint === 'sm' || breakpoint === 'xs' ? ['ptplayer-small'] : ['']
    },

    playerOptions() {
      // component options
      return {
        playsinline: true,

        // videojs options
        plugins: {},

        fluid: true,
        preload: 'auto',
        volume: 0.5,
        aspectRatio: '16:9',
        autoplay: true,
        width: '100%',
        language: 'en',

        bufferStart: 0,
        bufferEnd: 0,

        sources: [
          this.source,
        ],
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
      };
    },

    metadataImage() {
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
      return this.server.getUrlForLibraryLoc(this.metadata.thumb, w / 12, h / 4);
    },

  },
  methods: {

    // Player events
    closingPlayer() {
    },
    onPlayerPlay(player) {
    },
    onPlayerPause(player) {
    },
    onPlayerLoaded(player) {
    },
    onPlayerEnded(player) {
      this.$router.push('/browse');
      this.$emit('playbackEnded');
    },
    onPlayerCanplay(player) {
    },
    onPlayerCanplaythrough(player) {
    },
    onPlayerTimeupdate(player) {
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
            if (cancelled || !this.player || this.isPlaying === 'paused' || this.isPlaying === 'buffering' || oldSources !== this.player.options_.sources) {
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
            if (this.isPlaying === 'paused' || (lastPlayerTime === this.player.currentTime() * 1000)) {
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
    onPlayerLoadeddata(player) {
      const that = this;
      this.$nextTick(() => {
        this.player.currentTime(this.initialOffset / 1000);
      });

      player.on(['pause'], () => {
        this.isPlaying = 'paused';
      });
      player.on(['waiting'], () => {
        this.isPlaying = 'buffering';
      });
      player.on('playing', () => {
        this.isPlaying = 'playing';
      });

      // Setup our intervals for pinging the transcoder and timelines
      function send() {
        // console.log('Sending timeline')
        if (!that || !that.player) {
          return clearInterval(that.ticker);
        }
        if (!that.player || !that.metadata) {
          return;
        }
        let query = '';
        const params = {
          hasMDE: 1,
          ratingKey: that.metadata.ratingKey,
          key: that.metadata.key,
          state: that.isPlaying,
          time: that.lastTime,
          duration: Math.round(that.player.duration() * 1000),
          'X-Plex-Product': that.params['X-Plex-Product'],
          'X-Plex-Version': that.params['X-Plex-Version'],
          'X-Plex-Client-Identifier': that.params['X-Plex-Client-Identifier'],
          'X-Plex-Platform': that.params['X-Plex-Platform'],
          'X-Plex-Platform-Version': that.params['X-Plex-Platform-Version'],
          'X-Plex-Device': that.params['X-Plex-Device'],
          'X-Plex-Device-Name': that.params['X-Plex-Device-Name'],
          'X-Plex-Device-Screen-Resolution': that.params['X-Plex-Device-Screen-Resolution'],
          'X-Plex-Token': that.params['X-Plex-Token'],
          'X-Plex-Session-Identifier': that.params['X-Plex-Session-Identifier'],
        };
        for (const key in params) {
          query += `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`;
        }
        const url = `${that.server.chosenConnection.uri}/:/timeline?${query}`;
        request(url, (error, response, body) => {
          if (!error) {
            // console.log('Succesfully sent Player status to PMS')
          }
        });
      }

      this.ticker = setInterval(() => {
        // Tell the PMS instance of our status
        send();
      }, 10000);
      send();
    },
    onPlayerPlaying(player) {
    },
    onPlayerWaiting(player) {
    },
    onPlayerSeeking(player) {
      this.$emit('timelineUpdate', {
        time: this.player.currentTime() * 1000,
        status: this.isPlaying,
        bufferedTill: this.bufferedTill,
        duration: this.duration,
      });
    },
    onPlayerSeeked(player) {
      this.$emit('timelineUpdate', {
        time: this.player.currentTime() * 1000,
        status: this.isPlaying,
        bufferedTill: this.bufferedTill,
        duration: this.duration,
      });
    },
    playerStateChanged(playerCurrentState) {
      // console.log("Setting volume to " + this.player.volume() || 0)
      this.$store.commit('setSetting', ['PTPLAYERVOLUME', this.player.volume() || 0]);
      this.bufferedTill = Math.round(this.player.buffered().end(0) * 1000);
      this.duration = Math.round(this.player.duration() * 1000);
      this.bufferStart = Math.round(this.player.buffered().start(0) * 1000);
      this.bufferEnd = Math.round(this.player.buffered().end(0) * 1000);
      if (this.player.error_) {
        this.$emit('playerError');
      }
      if (playerCurrentState.timeupdate) {
        this.lastTime = Math.round(playerCurrentState.timeupdate * 1000);
      }
      if (playerCurrentState.pause) {
        this.isPlaying = 'paused';
      }
      if (playerCurrentState.playing) {
        this.isPlaying = 'playing';
      }
      this.playbackRate = this.player.playbackRate();
      this.$emit('timelineUpdate', {
        time: this.lastTime,
        status: this.isPlaying,
        bufferedTill: this.bufferedTill,
        duration: this.duration,
      });
    },
    playerReadied(player) {
      // console.log('Setting volume to ' + this.$store.getters.getSettingPTPLAYERVOLUME )
      this.player.volume(this.$store.getters.getSettings.PTPLAYERVOLUME || 0);
    },

  },
};
</script>
<style scoped>
</style>
