<template>
  <div class="v3player"></div>
</template>

<script>
import shaka from 'shaka-player';

const request = require('request');

export default {
  name: 'V3Player',
  components: {
  },
  props: ['server', 'metadata', 'initialOffset', 'src', 'initUrl', 'stopUrl', 'params', 'sources', 'video'],
  data() {
    return {
      player: null,

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
  watch: {},
  computed: {},
  created() {
    console.log('created');
  },
  mounted() {
    this.init();

    // Events from the parent component
    this.eventbus.$on('player-press-pause', (callback) => {
      if (this.isPlaying === 'paused') {
        return callback();
      }
      if (this.player) {
        this.video.pause();
      }
      return callback();
    });

    this.eventbus.$on('player-press-play', (callback) => {
      if (this.isPlaying === 'playing') {
        return callback();
      }
      if (this.video) {
        this.video.play();
      }
      return callback();
    });

    // this.eventbus.$on('player-seek', async (data) => {
    //   // Return a promise through the callback
    //   data.callback(this.seekMethod(data));
    // });
    // this.eventbus.$on('ptplayer-poll', (callback) => {
    //   try {
    //     callback(null, this.player.currentTime() * 1000);
    //   } catch (e) {
    //     return callback(e, -1);
    //   }
    // });
  },
  methods: {
    init() {
      this.log('[ShakaPlayer] - init');
      this.log('[ShakaPlayer] - version:', shaka.Player.version);
      this.log('[ShakaPlayer] - isBrowserSupported:', shaka.Player.isBrowserSupported());
      shaka.polyfill.installAll();

      // Check to see if the browser supports the basic APIs Shaka needs.
      if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        this.configure();
        this.source = this.src;
        this.initReqSent = true;
        this.$emit('playerMounted');
        this.log('player mounted');
        this.load();
      } else {
        // This browser does not have the minimum set of APIs we need.
        this.error('Browser not supported!');
      }
    },
    configure() {
      // Create player and bind event listeners.
      this.player = new shaka.Player(this.video);
      // this.setConfiguration();
      this.setPlayerEvents();
    },
    setPlayerEvents() {
      this.player.addEventListener('loadeddata', this.onPlayerLoadeddata());
      this.video.addEventListener('timeupdate', this.onBufferedData);
      // this.player.addEventListener('adaptation', this.onAdaptationEvent);
      // this.video.addEventListener('timeupdate', this.onTimeUpdate);
      this.video.addEventListener('playing', () => this.isPlaying = 'playing');
      this.video.addEventListener('buffering', () => this.isPlaying = 'buffering');
      this.video.addEventListener('pause', () => this.isPlaying = 'paused');
      this.video.addEventListener('ended', () => this.onPlayerEnded());

      this.video.addEventListener('onstatechange', () => this.playerStateChanged()); // todo
    },
    load() {
      this.log('shaka load');
      // Load url.
      this.player.load(this.source.src).then(() => {
        this.log('[ShakaPlayer] - video loaded');

        // Populate tracks.
        this.getTracks();
        this.log('play');
        this.video.play();
      }).catch((err) => {
        this.log('[ShakaPlayer] - error ', err);
      });
    },
    unload() {
      this.log('[ShakaPlayer] - unload');
      if (this.player) {
        this.player.unload();
        this.player.destroy();
        this.player = null;
      }
    },
    destroy() {
      this.log('[ShakaPlayer] - destroy');
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
    },
    selectTrack(id) {
      this.log('[ShakaPlayer] - selectTrack', id);
      this.player.selectVariantTrack({ id });
    },
    getTracks() {
      const tracks = this.player.getVariantTracks();
      let newTracks = [];

      tracks.forEach((o) => {
        const t = {
          id: o.id,
          name: o.bandwidth,
          active: o.active,
        };
        newTracks.push(t);
      });

      // Sort by name;
      newTracks = newTracks.sort((a, b) => (
        a.name - b.name
      ));
      this.$emit('tracks', newTracks);
    },
    enableAdaptation(enabled) {
      this.log('[ShakaPlayer] - enableAdaptation', enabled);
      this.player.configure({
        abr: { enabled },
      });
    },
    onAdaptationEvent(event) {
      this.log('[ShakaPlayer:onAdaptationEvent]', event);
      this.getTracks();
      // this.$emit('adaptation');
    },
    onBufferedData() {
      let behind = 0;
      let ahead = 0;
      const { currentTime, buffered } = this.video;
      for (let i = 0; i < buffered.length; i++) { // eslint-disable-line no-plusplus
        if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
          ahead = buffered.end(i) - currentTime;
          behind = currentTime - buffered.start(i);
          break;
        }
      }
      const data = `- ${behind.toFixed(0)}s / + ${ahead.toFixed(0)}s`;
      this.$emit('buffer', data);
    },


    // Logger.
    log(...message) {
      console.log('log', ...message);
    },

    onPlayerLoadeddata() {
      const that = this;
      this.$nextTick(() => {
        that.log('current time', that.video.currentTime);
        // this.player.currentTime(this.initialOffset / 1000);
      });

      // Setup our intervals for pinging the transcoder and timelines
      function send() {
        // console.log('Sending timeline')
        if (!that || !that.video) {
          return clearInterval(that.ticker);
        }
        if (!that.video || !that.metadata) {
          return;
        }
        let query = '';
        const params = {
          hasMDE: 1,
          ratingKey: that.metadata.ratingKey,
          key: that.metadata.key,
          state: that.isPlaying,
          time: that.lastTime,
          duration: Math.round(that.metadata.duration * 1000),
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
            // console.log('Succesfully sent Player status to PMS');
          }
        });
      }

      this.ticker = setInterval(() => {
        // Tell the PMS instance of our status
        send();
      }, 10000);
      send();
    },
    onPlayerEnded() {
      this.$router.push('/browse');
      this.$emit('playbackEnded');
    },
    // todo
    // playerStateChanged() {
    //   console.log(`Setting volume to ${this.player.volume()}` || 0);
    //   this.$store.commit('setSetting', ['PTPLAYERVOLUME', this.player.volume() || 0]);
    //   this.bufferedTill = Math.round(this.player.buffered().end(0) * 1000);
    //   this.duration = Math.round(this.player.duration() * 1000);
    //   this.bufferStart = Math.round(this.player.buffered().start(0) * 1000);
    //   this.bufferEnd = Math.round(this.player.buffered().end(0) * 1000);
    //   if (this.player.error_) {
    //     this.$emit('playerError');
    //   }
    //   if (playerCurrentState.timeupdate) {
    //     this.lastTime = Math.round(playerCurrentState.timeupdate * 1000);
    //   }
    //   if (playerCurrentState.pause) {
    //     this.isPlaying = 'paused';
    //   }
    //   if (playerCurrentState.playing) {
    //     this.isPlaying = 'playing';
    //   }
    //   this.playbackRate = this.player.playbackRate();
    //   this.$emit('timelineUpdate', {
    //     time: this.lastTime,
    //     status: this.isPlaying,
    //     bufferedTill: this.bufferedTill,
    //     duration: this.duration,
    //   });
    // },
  },
};
</script>

<style scoped>
video {
  background: #aaa;
  height: 100%;
  width: 100%;
}
</style>
