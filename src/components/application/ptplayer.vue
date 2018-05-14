<template>
  <div style="width:100%; max-height: calc(100vh - 64px)">
    <videoplayer v-if="playingMetadata && chosenServer && chosenQuality && ready"
      @playerMounted="playerMounted()"
      @timelineUpdate="timelineUpdate"
      @playbackEnded="stopPlayback()"

      :metadata="playingMetadata"
      :server="chosenServer"
      :src="getSourceByLabel(chosenQuality)"
      :initUrl="getSourceByLabel(chosenQuality).initUrl"
      :params="getSourceByLabel(chosenQuality).params"
      :initialOffset="playertime"
      :createdAt="playerCreatedAt"
    ></videoplayer>
    <v-dialog v-model="dialog" width="350">
      <v-card color="black">
        <v-card-title>Playback Settings </v-card-title>
        <v-card-text>
          <v-select
            v-model="chosenQuality"
            :items="qualitiesSelect"
            item-text="text"
            item-value="id"
            persistent-hint
            label="Quality"
            hint="Select a different quality"
          ></v-select>
          <v-select
            v-model="chosenAudioTrackIndex"
            :select-text="'Default'"
            label="Audio track"
            item-text="text"
            item-value="id"
            persistent-hint
            hint="Select a different audio track"
            :items="audioTrackSelect"
          ></v-select>
          <v-select
            persistent-hint
            label="Subtitles"
            item-text="text"
            item-value="id"
            hint="Select a different subtitle track"
            v-model="chosenSubtitleIndex"
            :select-text="'Default'"
            :items="subtitleTrackSelect"
          ></v-select>
          <v-select
            v-if="mediaIndexSelect.length > 1"
            persistent-hint
            item-text="text"
            item-value="id"
            hint="Select a different version of the content you're playing"
            v-model="chosenMediaIndex"
            label="Version"
            :items="mediaIndexSelect"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-btn class="blue--text darken-1" flat @click.native="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-layout v-if="playingMetadata && chosenServer" justify-center align-center row class="pa-3">
      <v-flex xs12 sm7>
        <v-layout row wrap justify-center align-center>
          <v-flex xs2 class="hidden-sm-and-down">
            <img :src="thumbUrl" class="elevation-20" style="height: 120px; width: auto; vertical-align: middle"/>
          </v-flex>
          <v-flex>
            <h1>{{ getTitle(playingMetadata) }}</h1>
            <h3>{{ getUnder(playingMetadata) }}</h3>
            <h5>Playing from {{ chosenServer.name  }}</h5>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex xs12 sm5>
        <v-btn :disabled="manualSyncQueued" color="blue" v-on:click.native.stop="doManualSync">Manual sync</v-btn>
        <v-btn color="primary" v-on:click.native.stop="dialog = !dialog">Playback Settings</v-btn>
        <router-link to="/browse">
          <v-btn color="error" v-on:click.native="stopPlayback()">Stop playback</v-btn>
        </router-link>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import videoplayer from './ptplayer/videoplayer.vue'
let plexthumb = require('./plexbrowser/plexthumb.vue')

var request = require('request')
var parseXMLString = require('xml2js').parseString

export default {
  name: 'ptplayer',
  components: {
    videoplayer, plexthumb
  },
  mounted: function () {
    // Check if we have params
    if (this.$route.query.start) {
      // We need to auto play
      let query = this.$route.query
      this.chosenKey = query.key.replace('/library/metadata/', '')
      this.chosenMediaIndex = query.mediaIndex || 0
      this.chosenServer = this.plex.servers[query.chosenServer]
      this.playertime = query.offset
    }

    // Similuate a real plex client
    this.eventbus.$on('command', data => {
      if (data.command === '/player/timeline/poll') {
        let key = this.chosenKey
        let ratingKey = null
        if (key) {
          ratingKey = '/library/metadata/' + key
        }
        let machineIdentifier = null
        if (this.chosenServer) {
          machineIdentifier = this.chosenServer.clientIdentifier
        }
        let playerdata = {
          key: key,
          ratingKey: ratingKey,
          time: this.playertime,
          type: 'video',
          machineIdentifier: machineIdentifier,
          duration: this.playerduration,
          state: this.playerstatus
        }
        return data.callback(playerdata)
      }
      if (data.command === '/player/playback/play') {
        this.eventbus.$emit('player-press-play', (res) => {
          return data.callback(res)
        })
        return
      }
      if (data.command === '/player/playback/pause') {
        this.eventbus.$emit('player-press-pause', function (res) {
          return data.callback(res)
        })
        return
      }
      if (data.command === '/player/playback/stop') {
        this.ready = false
        this.chosenKey = null
        this.chosenServer = null
        this.playerduration = null
        this.playertime = 0
        this.bufferedTile = null
        this.playingMetadata = null
        return data.callback(true)
      }
      if (data.command === '/player/playback/seekTo') {
        this.eventbus.$emit('player-seek', {
          time: data.params.offset,
          callback: async (promise) => {
            console.log('Player reported a seek result of ' + promise)
            await promise.catch((e) => {
              data.callback(false)
            })
            data.callback(true)
          }
        })
        return
      }
      console.log('Unable to process the remote control command ' + data.command)
    })
  },
  data () {
    return {
      eventbus: window.EventBus,

      chosenKey: null, // The item we are going to be playing from the chosen server eg. 12345
      chosenServer: null, // The Plex Media Server we are going to play from
      sessionId: this.generateGuid(),
      xplexsession: this.generateGuid(),

      // Content can have multiple copies
      // Below are options chosen for each copy
      chosenMediaIndex: 0, // The index of the item we want to play
      chosenQuality:
        JSON.parse(window['localStorage'].getItem('PTPLAYERQUALITY')) ||
        'Original', // The quality profile
      chosenSubtitleIndex: 0, // Subtitle track index
      chosenAudioTrackIndex: 0, // Audio track index
      sources: [],

      // Player status
      playertime: 0,
      playerstatus: 'stopped',
      playerduration: 0,
      bufferedTill: 0,
      playerCreatedAt: new Date().getTime(),

      // These are changed by the watched functions
      playingMetadata: null,
      ready: false,
      transcodeSessionMetadata: {},

      // Browser
      browser: this.getBrowser(),
      dialog: false
    }
  },
  watch: {
    chosenKey: function () {
      this.changedPlaying(true)
    },
    chosenServer: function () {
      this.changedPlaying(true)
    },
    chosenQuality: function () {
      this.changedPlaying(false)
      // console.log('Our new preferred quality is now ' + this.chosenQuality )
      this.$store.commit('setSettingPTPLAYERQUALITY', this.chosenQuality)
    },
    chosenMediaIndex: function () {
      this.chosenSubtitleIndex = 0
      this.chosenAudioTrackIndex = 0
      this.changedPlaying(false)
    },
    chosenAudioTrackIndex: function () {
      // console.log('Audio track change')
      var that = this
      let audioStreamID = this.playingMetadata.Media[this.chosenMediaIndex]
        .Part[0].Stream[this.chosenAudioTrackIndex].id
      let baseparams = this.getSourceByLabel(this.chosenQuality).params
      let params = {
        audioStreamID: audioStreamID,
        'X-Plex-Product': baseparams['X-Plex-Product'],
        'X-Plex-Version': baseparams['X-Plex-Version'],
        'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
        'X-Plex-Platform': baseparams['X-Plex-Platform'],
        'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
        'X-Plex-Device': baseparams['X-Plex-Device'],
        'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
        'X-Plex-Device-Screen-Resolution':
          baseparams['X-Plex-Device-Screen-Resolution'],
        'X-Plex-Token': baseparams['X-Plex-Token']
      }
      var query = ''
      for (let key in params) {
        query +=
          encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
      this.ready = false
      let options = {
        method: 'PUT',
        url: url
      }
      request(options, function (error, response, body) {
        if (!error) {
          that.changedPlaying(false)
        }
        // console.log(error)
      })
    },
    chosenSubtitleIndex: function () {
      // console.log('Subtitle track change')
      var that = this
      let subtitleStreamID = 0
      if (this.chosenSubtitleIndex > -1) {
        subtitleStreamID = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[this.chosenSubtitleIndex].id
      }
      let baseparams = this.getSourceByLabel(this.chosenQuality).params
      let params = {
        subtitleStreamID: subtitleStreamID,
        'X-Plex-Product': baseparams['X-Plex-Product'],
        'X-Plex-Version': baseparams['X-Plex-Version'],
        'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
        'X-Plex-Platform': baseparams['X-Plex-Platform'],
        'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
        'X-Plex-Device': baseparams['X-Plex-Device'],
        'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
        'X-Plex-Device-Screen-Resolution':
          baseparams['X-Plex-Device-Screen-Resolution'],
        'X-Plex-Token': baseparams['X-Plex-Token']
      }
      var query = ''
      for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
      this.ready = false
      let options = {
        method: 'PUT',
        url: url
      }
      request(options, function (error, response, body) {
        if (!error) {
          that.changedPlaying(false)
        }
        // console.log(error)
      })
    }
  },
  computed: {
    plex: function () {
      return this.$store.getters.getPlex
    },
    manualSyncQueued: function () {
      return this.$store.state.manualSyncQueued
    },
    chosenCombo: function () {
      // Helper for our watch chosenCombo
      return this.chosenKey || this.chosenServer
    },
    chosenClient () {
      return this.$store.getters.getChosenClient
    },
    mediaIndexSelect () {
      let mediaDone = []
      if (!this.playingMetadata) {
        return mediaDone
      }
      for (let i = 0; i < this.playingMetadata.Media.length; i++) {
        let current = this.playingMetadata.Media[i]
        mediaDone.push({
          id: i,
          text: current.videoResolution + 'p  (' + current.videoCodec + ' ' + current.bitrate + 'kbps)'
        })
      }
      return mediaDone
    },
    audioTrackSelect () {
      let audioTracks = []
      if (!this.playingMetadata) {
        return audioTracks
      }
      if (
        this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length === 1
      ) {
        return audioTracks
      }
      for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
        let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
        if (current.streamType === 2) {
          audioTracks.push({
            id: i,
            text: current.language + ' (' + current.codec + ' ' + current.audioChannelLayout + ')'
          })
        }
      }
      return audioTracks
    },
    subtitleTrackSelect () {
      let subtitleTracks = []
      if (!this.playingMetadata) {
        return subtitleTracks
      }
      if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length === 1) {
        return subtitleTracks
      }
      subtitleTracks.push({
        id: -1,
        text: 'None'
      })
      for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
        let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
        if (current.streamType === 3) {
          subtitleTracks.push({
            id: i,
            text: current.language + ' (' + current.codec + ')'
          })
        }
      }

      return subtitleTracks
    },
    qualitiesSelect () {
      let sourcesDone = []
      for (let i = 0; i < this.sources.length; i++) {
        sourcesDone.push({
          id: this.sources[i].label,
          text: this.sources[i].label
        })
      }
      return sourcesDone
    },
    thumbUrl () {
      if (!this.playingMetadata) {
        return
      }
      return this.plex.servers[this.$route.query.chosenServer].getUrlForLibraryLoc(this.playingMetadata.grandparentThumb || this.playingMetadata.thumb, 200, 200)
    }
  },
  methods: {
    playerMounted: function () {
      // console.log('Child player said it is mounted')
    },
    getSourceByLabel: function (label) {
      for (let i = 0; i < this.sources.length; i++) {
        let source = this.sources[i]
        if (source.label === label) {
          return source
        }
      }
      return null
    },
    doManualSync: function () {
      this.$store.commit('SET_VALUE', 'manualSyncQueued', true)
    },
    openModal () {
      return this.$refs.playersettingsModal.open()
    },
    getTitle (content) {
      switch (content.type) {
        case 'movie':
          if (this.fullTitle !== undefined) {
            if (content.year) {
              return content.title + ' (' + content.year + ')'
            }
          }
          return content.title
        case 'show':
          return content.title
        case 'season':
          if (this.fullTitle !== undefined) {
            return content.parentTitle
          }
          return content.title
        case 'episode':
          if (this.fullTitle !== undefined) {
            return content.title
          }
          return content.grandparentTitle
        default:
          return content.title
      }
    },
    getUnder (content) {
      switch (content.type) {
        case 'movie':
          if (content.year) {
            return content.year
          }
          return ' '
        case 'show':
          if (content.childCount === 1) {
            return content.childCount + ' season'
          }
          return content.childCount + ' seasons'
        case 'season':
          if (this.fullTitle !== undefined) {
            return content.title
          }
          return content.leafCount + ' episodes'
        case 'album':
          return content.year
        case 'artist':
          return ''
        case 'episode':
          if (this.fullTitle !== undefined) {
            return 'Episode ' + content.index
          }
          return (
            ' S' +
            content.parentIndex +
            'E' +
            content.index +
            ' - ' +
            content.title
          )
        default:
          return content.title
      }
    },
    generateSources () {
      var that = this
      let QualityTemplate = function (label, resolution, bitrate, videoQuality) {
        var session = that.generateGuid()
        this.label = label
        this.initUrl = that.initTranscodeSessionUrl({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality: videoQuality,
          session: session
        })
        this.params = that.getBaseParams({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality: videoQuality,
          session: session
        })
        this.src = that.generateTranscodeUrl({
          maxVideoBitrate: bitrate,
          videoResolution: resolution,
          videoQuality: videoQuality,
          session: session
        })
        this.stopUrl = that.generateTranscodeStopUrl({
          session: session
        })
        this.type = 'application/x-mpegURL'
      }
      let qualities = [
        new QualityTemplate('64 Kbps', '220x128', 64, 10),
        new QualityTemplate('96 Kbps', '220x128', 96, 20),
        new QualityTemplate('208 Kbps', '284x160', 208, 30),
        new QualityTemplate('320 Kbps', '420x240', 320, 30),
        new QualityTemplate('720 Kbps', '576x320', 720, 40),
        new QualityTemplate('1.5 Mbps 480p', '720x480', 1500, 60),
        new QualityTemplate('2 Mbps 720p', '1280x720', 2000, 60),
        new QualityTemplate('3 Mbps 720p', '1280x720', 3000, 75),
        new QualityTemplate('4 Mbps 720p', '1280x720', 4000, 100),
        new QualityTemplate('8 Mbps 1080p', '1920x1080', 8000, 60),
        new QualityTemplate('10 Mbps 1080p', '1920x1080', 10000, 75),
        new QualityTemplate('12 Mbps 1080p', '1920x1080', 12000, 90),
        new QualityTemplate('20 Mbps 1080p', '1920x1080', 20000, 100),
        new QualityTemplate('Original', null, null, null)
      ]
      return qualities
    },
    stopPlayback () {
      console.log('Stopped Playback')
      this.$store.commit('SET_DECISIONBLOCKED', false)
      request(this.getSourceByLabel(this.chosenQuality).stopUrl, () => {})
      this.playerstatus = 'stopped'
      this.sessionId = this.generateGuid()
      this.xplexsession = this.generateGuid()
      this.chosenClient.pressStop(function () {})
    },
    changedPlaying: function (changeItem) {
      this.ready = false
      this.$store.commit('SET_DECISIONBLOCKED', false)
      console.log('Changed what we are meant to be playing!', changeItem)
      if (!this.chosenKey || !this.chosenServer) {
        this.playerstatus = 'stopped'
        this.playerMetadata = null
        return
      }

      const req = () => {
        this.sources = this.generateSources()
        request(
          this.getSourceByLabel(this.chosenQuality).initUrl,
          (error, response, body) => {
            parseXMLString(body, (err, result) => {
              if (err) {
                this.ready = false
              }
              this.ready = true
              this.transcodeSessionMetadata = result
            })
            if (!error) {
            }
          }
        )
      }

      if (this.playingMetadata) {
        request(
          this.getSourceByLabel(this.chosenQuality).stopUrl, () => {
            // We dont need to know what this resulted in
          }
        )
      }
      if (changeItem || !this.playingMetadata) {
        this.playingMetadata = null
        this.chosenServer.getMediaByRatingKey(this.chosenKey).then(result => {
          this.playingMetadata = result.MediaContainer.Metadata[0]
          req()
        })
      } else {
        req()
      }
    },
    timelineUpdate (data) {
      this.playertime = data.time
      this.playerstatus = data.status
      this.bufferedTill = data.bufferedTill
      this.playerduration = data.duration
    },
    playerSeekDone (data) {},
    generateTranscodeUrl (overrideparams) {
      let params = this.getBaseParams(overrideparams)

      var query = ''
      for (let key in params) {
        query +=
          encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      let url =
        this.chosenServer.chosenConnection.uri +
        '/video/:/transcode/universal/start.m3u8?' +
        query
      // console.log(url)
      return url
    },
    generateTranscodeStopUrl (overrideparams) {
      let params = {
        session: this.sessionId,
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': '3.4.1',
        'X-Plex-Client-Identifier': 'SyncLounge',
        'X-Plex-Platform': this.browser,
        'X-Plex-Platform-Version': '57.0',
        'X-Plex-Device': 'Windows',
        'X-Plex-Device-Screen-Resolution':
          window.screen.availWidth + 'x' + window.screen.availHeight,
        'X-Plex-Token': this.chosenServer.accessToken
      }
      for (let key in overrideparams) {
        if (!overrideparams[key]) {
          delete params[key]
        } else {
          params[key] = overrideparams[key]
        }
      }
      let query = ''
      for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/stop?' + query
      // console.log(url)
      return url
    },
    initTranscodeSessionUrl (overrideparams) {
      // We need to tell the Plex Server to start transcoding
      let params = this.getBaseParams(overrideparams)

      var query = ''
      for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/decision?' + query
      return url
    },
    getBaseParams (overrideparams) {
      let location = 'wan'
      if (this.plex.servers[this.playingMetadata.machineIdentifier].publicAddressMatches === '1') {
        location = 'lan'
      }
      let params = {
        hasMDE: 1,
        path: this.playingMetadata.key,
        mediaIndex: this.chosenMediaIndex,
        partIndex: 0,
        protocol: 'hls',
        fastSeek: 1,
        directPlay: 0,
        directStream: 0,
        subtitleSize: 100,
        audioBoost: 100,
        location: location,
        session: this.sessionId,
        offset: 0,
        // offset: Math.round(this.playertime / 1000),
        subtitles: 'burn',
        copyts: 1,
        'Accept-Language': 'en',
        'X-Plex-Session-Identifier': this.xplexsession,
        'X-Plex-Chunked': 1,
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': '3.4.1',
        'X-Plex-Client-Identifier': 'SyncLounge',
        'X-Plex-Platform': 'SyncLounge',
        'X-Plex-Platform-Version': '57.0',
        'X-Plex-Device': 'HTML TV App',
        'X-Plex-Device-Name': 'SyncLounge',
        'X-Plex-Device-Screen-Resolution':
          window.screen.availWidth + 'x' + window.screen.availHeight,
        'X-Plex-Token': this.chosenServer.accessToken
      }
      for (let key in overrideparams) {
        if (!overrideparams[key]) {
          delete params[key]
        } else {
          params[key] = overrideparams[key]
        }
      }
      return params
    },
    sendPMSPoll () {
      // // We need to tell the PMS about our player every 20s

      // const send = () => {
      //   let params = {
      //     deviceClass: 'pc',
      //     protocolCapabilities: 'playback',
      //     protocolVersion: '1',
      //     timeout: 1,
      //     'X-Plex-Product': 'SyncLounge',
      //     'X-Plex-Version': '3.4.1',
      //     'X-Plex-Client-Identifier': 'SyncLounge',
      //     'X-Plex-Platform': this.browser,
      //     'X-Plex-Platform-Version': '57.0',
      //     'X-Plex-Device': 'Windows',
      //     'X-Plex-Device-Name': 'SyncLounge',
      //     'X-Plex-Device-Screen-Resolution':
      //       window.screen.availWidth + 'x' + window.screen.availHeight,
      //     'X-Plex-Token': this.chosenServer.accessToken
      //   }
      //   let query = ''
      //   for (let key in params) {
      //     query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      //   }
      //   let url = this.chosenServer.chosenConnection.uri + '/player/proxy/poll?' + query
      //   request(url, function () {})
      // }

      // setInterval(function () {
      //   // send()
      // }, 20000)
      // // send()
    },
    generateGuid () {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1)
      }
      return s4() + s4() + s4() + s4()
    },
    getBrowser () {
      let sBrowser
      let sUsrAg = navigator.userAgent
      if (sUsrAg.indexOf('Chrome') > -1) {
        sBrowser = 'Chrome'
      } else if (sUsrAg.indexOf('Safari') > -1) {
        sBrowser = 'Safari'
      } else if (sUsrAg.indexOf('Opera') > -1) {
        sBrowser = 'Opera'
      } else if (sUsrAg.indexOf('Firefox') > -1) {
        sBrowser = 'Firefox'
      } else if (sUsrAg.indexOf('MSIE') > -1) {
        sBrowser = 'Microsoft Internet Explorer'
      }
      return sBrowser
    }
  }
}
</script>
