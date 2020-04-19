<template>
  <div class="controls player-controls">
    <button class="material-icons" v-on:click="pause" v-if="playing">pause_arrow</button>
    <button class="material-icons" v-on:click="play" v-else>play_arrow</button>
    <input
      class="seekBar"
      type="range"
      step="any"
      min="0"
      v-bind:max="duration"
      v-bind:value="currentTime"
      @change="onSeekChange"
     />
    <button class="rewindButton material-icons">fast_rewind</button>
    <div class="currentTime">{{ timeString }} / {{ durationString }}</div>
    <button class="fastForwardButton material-icons">fast_forward</button>
    <button class="muteButton material-icons" v-on:click="setMute" v-if="muted">volume_mute</button>
    <button class="muteButton material-icons" v-on:click="setMute" v-else>volume_up</button>
    <input
      class="volumeBar"
      type="range"
      step="any"
      min="0"
      max="1"
      v-bind:value="volume"
      v-bind:style="{
        background: 'linear-gradient(to right, rgb(204, 204, 204) '
          + volume * 100 + '%, rgb(0, 0, 0) '
          + volume * 100 + '%, rgb(0, 0, 0) 100%)'
      }"
      @change="onVolumeChange"
    />
  </div>
</template>

<script>
import './../../../assets/css/player-controls.css';

export default {
  name: 'controls',
  components: {},
  props: ['video', 'metadata'],
  data() {
    return {
      loaded: false,
      playing: false,
      seeking: false,
      duration: 0,
      currentTime: 0,
      volume: 0.70,
      savedVolume: 0.70,
      muted: false,
    };
  },
  computed: {
    timeString() {
      return this.buildTimeString(this.currentTime, true);
    },
    durationString() {
      return this.buildTimeString(this.duration, true);
    },
  },
  watch: {
    video() {
      // Initialize when video is ready.
      this.init();
    },
  },
  created() {},
  mounted() {},
  methods: {
    init() {
      this.setPlayerEvents();
    },

    setPlayerEvents() {
      // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
      this.video.addEventListener('playing', this.onPlaying);
      this.video.addEventListener('pause', this.onPause);
      this.video.addEventListener('durationchange', this.onDurationChange);
      this.video.addEventListener('timeupdate', this.onTimeUpdate);
      this.video.addEventListener('volumechange', this.onVolumeChange);
    },

    play() {
      this.video.play();
    },

    pause() {
      this.video.pause();
    },

    stop() {
      this.video.stop();
    },

    seekTo(value) {
      this.video.currentTime = value;
    },

    setMute() {
      this.muted = !this.muted;
      if (this.muted) {
        this.savedVolume = this.volume;
        this.volume = 0;
      } else {
        this.volume = this.savedVolume;
      }
      this.video.muted = this.muted;
    },

    onPlaying() {
      this.playing = true;
    },

    onPause() {
      this.playing = false;
    },

    onSeekChange(event) {
      this.seeking = true;
      if (event.target && event.target.value) {
        this.seekTo(event.target.value);
      }
    },

    onVolumeChange(event) {
      if (event.target && event.target.value) {
        this.video.volume = parseFloat(event.target.value);
        this.volume = event.target.value;
      } else if (event.target && event.target.volume) {
        this.video.volume = parseFloat(event.target.volume);
        this.volume = event.target.volume;
      }
      this.muted = this.volume === '0';
    },

    onDurationChange(event) {
      this.duration = event.target.duration;
    },

    onTimeUpdate(event) {
      this.currentTime = event.target.currentTime;
    },
    buildTimeString(displayTime, showHour) {
      const h = Math.floor(displayTime / 3600);
      const m = Math.floor((displayTime / 60) % 60);
      let s = Math.floor(displayTime % 60);
      if (s < 10) s = `0${s}`;
      let text = `${m}:${s}`;
      if (showHour) {
        if (m < 10) text = `0${text}`;
        text = `${h}:${text}`;
      }
      return text;
    },
  },
};
</script>

<style scoped>
.controls {
  margin: 10px 0;
  text-align: left;
}
.controls button:hover,
.controls button:focus {
  color: #fff;
}
</style>
