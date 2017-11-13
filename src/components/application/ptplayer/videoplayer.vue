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
      style="background-color:transparent !important"
      class="ptplayer">
    </video-player>
    <div class="center" v-if="!src">
      Waiting...
    </div>
  </div>
</template>

<script>
  var request = require('request')

  export default {
    props: ['server', 'metadata', 'initialOffset', 'src', 'initUrl', 'stopUrl', 'params', 'sources'],
    created () {

    },
    data () {
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
      }
    },
    mounted () {
      var that = this

      that.source = that.src
      that.initReqSent = true
      this.$emit('playerMounted')

      // Events from the parent component
      this.eventbus.$on('player-press-pause', function (callback) {
        if (that.isPlaying == 'paused') {
          return callback(true)
        }
        if (that.player) {
          that.player.pause()
          return callback(true)
        }
        return callback(false)
      })

      this.eventbus.$on('player-press-play', function (callback) {
        if (that.isPlaying == 'playing') {
          return callback(true)
        }
        if (that.player) {
          that.player.play()
          return callback(true)
        }
        return callback(false)
      })

      this.eventbus.$on('player-seek', (data) => {
        let seekTo = data.time
        console.log('We have been told we need to seek to position ' + seekTo)
        // The parent will only ever send us this command if we are within 10s, lets change our playback speed to 3x to catch up
        let playbackSpeed = 1.0
        let iterations = 0
        if (!that.player.isReady_) {
          return data.callback(false)
        }
        try {
          if (!that.player || !that.player.currentTime()) {
            return data.callback(false)
          }
        } catch (e) {
          return data.callback(false)
        }
        let oldVolume = that.player.volume()
        console.log('Player checks passed')
        let lastPlayerSpeed = that.player.currentTime()
        let lastPlayerTime = that.player.currentTime() * 1000


        
        if (seekTo < that.bufferedEnd && seekTo > that.bufferStart){      
          console.log('Seeking to a buffered time')    
          that.player.currentTime(seekTo)
          return data.callback(true)
        }


        if (Math.abs(seekTo - that.lastTime) < 7000 && !that.blockedSpeedChanges) {
          console.log('Seeking via the speed up method')
          let oldSources = that.player.options_.sources
          let clicker = setInterval(function () {
            if (that.isPlaying == 'paused' || that.isPlaying == 'buffering' || oldSources != that.player.options_.sources) {
              clearInterval(clicker)
              return data.callback(false)
            }
            iterations++
            try{
              if (!that.player || !that.player.currentTime() || !that.player.playbackRate()) {
                return
              }
            }
            catch (e) {
              clearInterval(clicker)
              return data.callback(false)
            }
            console.log('Playback rate: ' + that.player.playbackRate())
            if (lastPlayerSpeed == that.player.playbackRate()) {
              // Our played doesnt want to change it speed, lets swap to clean seek
              console.log('Failed seek attempt - swapping to clean seek')
              that.blockedSpeedChanges = true
              data.callback(false)
              return clearInterval(clicker)
            }
            if (that.isPlaying == 'paused' || (lastPlayerTime == that.player.currentTime() * 1000)) {
              console.log('Skipping this iteration because our player state is ' + that.isPlaying + ' or lastPlayerTime is equal to the current player time')
              return
            }
            lastPlayerTime = that.player.currentTime * 1000
            let slidingTime = seekTo + (25 * iterations)
            let current = Math.round(that.player.currentTime() * 1000)
            let difference = Math.abs(current - (slidingTime))
            if (current < slidingTime) {
              // Speed up
              playbackSpeed = playbackSpeed + 0.0005
              if (that.player.playbackRate() < 1.1) {
                that.player.playbackRate(playbackSpeed)
              }
            }
            if (current > slidingTime) {
              // Slow down
              playbackSpeed = playbackSpeed - 0.0005
              if (that.player.playbackRate() > 0.95) {
                that.player.playbackRate(playbackSpeed)
              }
            }

            console.log('We are ' + difference + 'ms away from where we need to be')
            if (difference < 50) {
              console.log('Child: Done seeking')
              that.player.playbackRate(1.0)
              data.callback(true)
              clearInterval(clicker)
              return
            }
            lastPlayerSpeed = that.player.currentTime()
          }, 25)
        } else {
          console.log('Directly seeking to a time')
          if (!that.player || !that.player.currentTime()) {
            data.callback(false)
          }
          let oldTime = this.lastTime
          that.player.currentTime(seekTo / 1000)
          let ticks = 0
          let ticker = setInterval(() => {
            console.log('Waiting for the player to skip..')
            if (oldTime != this.lastTime) {
              clearInterval(ticker)
              console.log('Success on seeking to a direct point in time')
              return data.callback(true)
            }
            ticks++
            if (ticks > 150) {
              clearInterval(ticker)
              return data.callback(false)
            }
          }, 100)
        }
      })
    },
    beforeDestroy () {
      clearInterval(this.ticker)
      this.eventbus.$off('player-press-pause')
      this.eventbus.$off('player-press-play')
      this.eventbus.$off('player-seek')

      var query = '';
      let params = {
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
        'X-Plex-Session-Identifier': this.params['X-Plex-Session-Identifier']
      }
      for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
      }
      let url = this.server.chosenConnection.uri + '/:/timeline?' + query
      let options = {
        timeout: 2000,
        url: url
      }
      console.log('Sending timeline stop')
      request(url, function (error, response, body) {
        if (!error) {
          // console.log('Succesfully sent Player status to PMS')
        }
      })
    },
    computed: {
      player () {
        if (this.$refs && this.$refs.videoPlayer) {
          return this.$refs.videoPlayer.player
        }
      },
      bufferStart: function () {        
        return Math.round(this.player.buffered().start(0) * 1000)
      },
      bufferEnd: function () {
        return Math.round(this.player.buffered().end(0) * 1000)
      },
      playerOptions () {

        // component options
        return {
          playsinline: true,

          // videojs options
          plugins: {},

          fluid: false,
          preload: 'auto',
          volume: 0.5,
          aspectRatio: '16:9',
          autoplay: true,
          width: '100%',
          language: 'en',

          sources: [
            this.source
          ],
          controlBar: {
            children: {
              'playToggle': {},
              'muteToggle': {},
              'volumeControl': {},
              'currentTimeDisplay': {},

              'flexibleWidthSpacer': {},
              'progressControl': {},
              'timeDivider': {},
              'liveDisplay': {},
              'durationDisplay': {},
              'fullscreenToggle': {}
            }
          }
        }
      },

      metadataImage: function () {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(this.metadata.thumb, w / 12, h / 4)
      }

    },
    methods: {

      // Player events
      closingPlayer () {
      },
      onPlayerPlay (player) {
      },
      onPlayerPause (player) {
      },
      onPlayerLoaded (player) {
      },      
      onPlayerEnded (player) {        
        this.$emit('playbackEnded')
      },
      onPlayerCanplay (player) {
      },
      onPlayerCanplaythrough (player) {
      },
      onPlayerTimeupdate (player) {
      },
      onPlayerLoadeddata (player) {
        var that = this

        this.player.currentTime(this.initialOffset / 1000)

        player.on(['waiting', 'pause'], function () {
          that.isPlaying = 'paused';
        });

        player.on('playing', function () {
          that.isPlaying = 'playing';
        });

        // Setup our intervals for pinging the transcoder and timelines
        function send () {
          //console.log('Sending timeline')
          if (!that) {
            return clearInterval(that.ticker)
          }
          if (!that.player || !that.metadata) {
            return
          }
          var query = '';
          let params = {
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
            'X-Plex-Session-Identifier': that.params['X-Plex-Session-Identifier']
          }
          for (let key in params) {
            query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
          }
          let url = that.server.chosenConnection.uri + '/:/timeline?' + query
          let options = {
            timeout: 2000,
            url: url
          }
          request(url, function (error, response, body) {
            if (!error) {
              // console.log('Succesfully sent Player status to PMS')
            }
          })
        }

        this.ticker = setInterval(function () {
          // Tell the PMS instance of our status
          send()
        }, 10000)
        send()
      },
      onPlayerPlaying (player) {
      },
      onPlayerWaiting (player) {
      },
      onPlayerSeeking (player) {
      },
      onPlayerSeeked (player) {
        console.log(player)
      },
      playerStateChanged (playerCurrentState) {
        // console.log("Setting volume to " + this.player.volume() || 0)
        this.$store.commit('setSettingPTPLAYERVOLUME', this.player.volume() || 0)
        this.bufferedTill = Math.round(this.player.buffered().end(0) * 1000)
        this.duration = Math.round(this.player.duration() * 1000)
        if (this.player.error_) {
          this.$emit('playerError')
        }
        if (playerCurrentState.timeupdate) {
          this.lastTime = Math.round(playerCurrentState.timeupdate * 1000)
        }
        if (playerCurrentState.pause) {
          this.isPlaying = 'paused'
        }
        if (playerCurrentState.playing) {
          this.isPlaying = 'playing'
        }
        this.$emit('timelineUpdate', {
          time: this.lastTime,
          status: this.isPlaying,
          bufferedTill: this.bufferedTill,
          duration: this.duration
        })
      },
      playerReadied (player) {
        // console.log('Setting volume to ' + this.$store.getters.getSettingPTPLAYERVOLUME )
        this.player.volume(this.$store.getters.getSettingPTPLAYERVOLUME || 0)
      },

    }
  }
</script>
