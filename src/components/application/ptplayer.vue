<template>
  <div style="width:100%; height:100%">
    <videoplayer v-if="playingMetadata && chosenServer && chosenQuality && ready"
                 @playerMounted="playerMounted()"
                 @timelineUpdate="timelineUpdate"
                 @playbackEnded="stopPlayback()"


                 :metadata="playingMetadata"
                 :server="chosenServer"
                 :src="getSourceByLabel(chosenQuality)"
                 :initUrl="getSourceByLabel(chosenQuality).initUrl"
                 :params="getSourceByLabel(chosenQuality).params"
                 :initialOffset="offset"
                 :createdAt="playerCreatedAt"
    ></videoplayer>
    <v-dialog v-model="dialog"> 
      <v-card>
        <v-card-row>
          <v-card-title>Playback Settings </v-card-title>
        </v-card-row>
        <v-card-row>
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
        </v-card-row>
        <v-card-row actions>
          <v-btn class="blue--text darken-1" flat @click.native="dialog = false">Close</v-btn>
        </v-card-row>
      </v-card>
    </v-dialog>
    <v-layout v-if="playingMetadata && chosenServer" row justify-center>
      <v-flex md2>
        <v-btn primary v-on:click.native.stop="dialog = !dialog">Playback Settings</v-btn>
      </v-flex>
      <v-flex md2>
        <v-btn error v-on:click.native="stopPlayback()">Stop playback</v-btn>
      </v-flex>
    </v-layout>

  </div>
</template>

<script>
  // CSS imports

  var request = require('request')
  var parseXMLString = require('xml2js').parseString;
  // Components
  import videoplayer from './ptplayer/videoplayer.vue'

  export default {
    name: 'ptplayer',
    components: {
      videoplayer,
    },
    created () {
    },
    mounted: function () {
      var that = this

      // Similuate a real plex client
      this.eventbus.$on('command', (data) => {
        if (data.command == '/player/timeline/poll') {
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
        if (data.command == '/player/playback/play') {
          this.eventbus.$emit('player-press-play', function (res) {
            return data.callback(res)
          })
          return
        }
        if (data.command == '/player/playback/pause') {
          this.eventbus.$emit('player-press-pause', function (res) {
            return data.callback(res)
          })
          return
        }
        if (data.command == '/player/playback/stop') {
          this.ready = false
          this.chosenKey = null
          this.chosenServer = null
          this.playerduration = null
          this.playertime = 0
          this.bufferedTile = null
          this.playingMetadata = null
          this.initDoneAudio = false
          this.initDoneSubs = false
          return data.callback(true)
        }
        if (data.command == '/player/playback/seekTo') {
          this.eventbus.$emit('player-seek', {
            time: data.params.offset,
            callback: function (res) {
              //console.log('Player reported a seek result of ' + res)
              data.callback(res)
            }
          })
          return
        }
        if (data.command == '/player/playback/playMedia') {
          this.chosenKey = data.params.key.replace('/library/metadata/', '')
          this.chosenMediaIndex = data.params.mediaIndex || 0
          this.chosenServer = this.plex.getServerById(data.params.machineIdentifier)
          this.playertime = data.params.offset
          let oldtime = this.playertime
          let oldkey = this.chosenKey
          let checkers = 0

          let tick = setInterval(() => {
            console.log('Checking..')
            if (Math.abs(parseInt(this.playertime) - parseInt(oldtime) ) > 1000) {
              console.log('STARTED PLAYING!')
              clearInterval(tick)
              return data.callback(true)
            }
            checkers++
            if (checkers > 300 || oldkey != this.chosenKey) {
              console.log('Timeout reached on playMedia')
              // It has been 30 seconds since - fail
              clearInterval(tick)
              return data.callback(false)
            }
          }, 100)
        }
        console.log('Unable to process the remote control command ' + data.command)
      })

    },
    data () {
      return {
        eventbus: window.EventBus,

        offset: 0,
        chosenKey: null, // The item we are going to be playing from the chosen server eg. 12345
        chosenServer: null, // The Plex Media Server we are going to play from
        sessionId: this.generateGuid(),
        xplexsession: this.generateGuid(),

        // Content can have multiple copies
        // Below are options chosen for each copy
        chosenMediaIndex: 0, // The index of the item we want to play
        chosenQuality: JSON.parse(window['localStorage'].getItem('PTPLAYERQUALITY')) || 'Original', // The quality profile
        chosenSubtitleIndex: -100, // Subtitle track index
        chosenAudioTrackIndex: -100, // Audio track index
        initDoneAudio: false,
        initDoneSubs: false,
        sources: [],

        // Player status
        playertime: 0,
        playerstatus: 'stopped',
        playerduration: 0,
        bufferedTill: 0,
        playerCreatedAt: (new Date).getTime(),

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
        //console.log('Chosen key changed')
        this.changedPlaying(true)
      },
      chosenServer: function () {
        //console.log('Chosen server changed')
        //this.changedPlaying(true)
      },
      chosenQuality: function () {
        //console.log('Chosen quality changed')
        this.changedPlaying(false)
        //console.log('Our new preferred quality is now ' + this.chosenQuality )
        this.$store.commit('setSettingPTPLAYERQUALITY',this.chosenQuality)
      },
      chosenMediaIndex: function () {

        this.chosenSubtitleIndex = 0
        this.chosenAudioTrackIndex = 0
        //console.log('Chosen mediaindex changed')
        this.changedPlaying(false)
      },
      chosenAudioTrackIndex: function () {
        if (this.chosenAudioTrackIndex == -100 || !this.initDoneAudio){
          console.log('Audio track changed but not going to do any work')
          return
        }
        console.log('Audio track change')
        if (this.playingMetadata && this.playingMetadata.type == 'episode') {
          // We should save this preference for this series in our localStorage

          let seriesKey = this.playingMetadata.grandparentKey
          let languageCode = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[this.chosenAudioTrackIndex].languageCode
          console.log('Our prefered audio track for ' + seriesKey + ' is now ' + languageCode)
          this.savePrefence('audio',seriesKey,languageCode)
          
        }
        this.changeAudioTrack(() => {          
          this.changedPlaying(false)
        })

      },
      chosenSubtitleIndex: function () {      
        if (this.chosenSubtitleIndex == -100 || !this.initDoneSubs){
          console.log('Sub track changed but not going to do any work')
          return
        } 
        console.log('Subtitle track change')
        if (this.playingMetadata && this.playingMetadata.type == 'episode') {
          // We should save this preference for this series in our localStorage

          let seriesKey = this.playingMetadata.grandparentKey

          if (this.chosenSubtitleIndex == -1){
            this.savePrefence('subs',seriesKey,'')
          } else {
            let languageCode = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[this.chosenSubtitleIndex].languageCode
            console.log('Our prefered subtitle track for ' + seriesKey + ' is now ' + languageCode)
            this.savePrefence('subs',seriesKey,languageCode)
          }          
        }
        this.changeSubtitleTrack((res) => {
          this.changedPlaying(false)
        })
      }
    },
    computed: {
      plex: function () {
        return this.$store.getters.getPlex
      },
      chosenCombo: function () {
        // Helper for our watch chosenCombo
        return this.chosenKey || chosenServer
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
        if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1) {
          return audioTracks
        }
        for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
          let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
          if (current.streamType == 2) {
            audioTracks.push({
              id: i,
              text: current.language + ' (' + current.codec + ' ' + current.audioChannelLayout + ')'
            })
          }
        }
        return audioTracks
      },
      audioTracks () {
        let audioTracks = []
        if (!this.playingMetadata) {
          return audioTracks
        }
        if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1) {
          return audioTracks
        }
        for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
          let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
          if (current.streamType == 2) {
            audioTracks.push(current)
          }
        }
        return audioTracks
      },
      subtitleTrackSelect () {
        let subtitleTracks = []
        if (!this.playingMetadata) {
          return subtitleTracks
        }
        if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1) {
          return subtitleTracks
        }
        subtitleTracks.push({
          id: -1,
          text: 'None'
        })
        for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
          let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
          if (current.streamType == 3) {
            subtitleTracks.push({
              id: i,
              text: current.language + ' (' + current.codec + ')'
            })
          }

        }
        return subtitleTracks
      },      
      subtitleTracks () {
        let subtitleTracks = []
        if (!this.playingMetadata) {
          return subtitleTracks
        }
        if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1) {
          return subtitleTracks
        }
        for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++) {
          let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
          if (current.streamType == 3) {
            subtitleTracks.push(current)
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
      }
    },
    methods: {
      playerMounted: function () {
        var that = this
        //console.log('Child player said it is mounted')
      },
      getSourceByLabel: function (label) {
        for (let i = 0; i < this.sources.length; i++) {
          let source = this.sources[i]
          if (source.label == label) {
            return source
          }
        }
        return null
      },
      changeSubtitleTrack (callback) {
        console.log('Changing the subtitle track')
        var that = this
        let subtitleStreamID = 0
        if (this.chosenSubtitleIndex > -1) {
          subtitleStreamID = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[this.chosenSubtitleIndex].id
        }
        let baseparams = this.getSourceByLabel(this.chosenQuality).params
        let params = {
          'subtitleStreamID': subtitleStreamID,
          'X-Plex-Product': baseparams['X-Plex-Product'],
          'X-Plex-Version': baseparams['X-Plex-Version'],
          'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
          'X-Plex-Platform': baseparams['X-Plex-Platform'],
          'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
          'X-Plex-Device': baseparams['X-Plex-Device'],
          'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
          'X-Plex-Device-Screen-Resolution': baseparams['X-Plex-Device-Screen-Resolution'],
          'X-Plex-Token': baseparams['X-Plex-Token']
        }
        var query = '';
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }
        let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
        this.ready = false
        let options = {
          method: 'PUT',
          url: url
        }
        request(options, function (error, response, body) {
          if (!error) {
            return callback(true)
          }
          return callback(false)
          //console.log(error)
        })
      },
      changeAudioTrack (callback){
        console.log('Changing the audio track')
        if (this.chosenAudioTrackIndex < 0){
          return
        }
        var that = this
        let audioStreamID = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[this.chosenAudioTrackIndex].id
        let baseparams = this.getSourceByLabel(this.chosenQuality).params
        let params = {
          'audioStreamID': audioStreamID,
          'X-Plex-Product': baseparams['X-Plex-Product'],
          'X-Plex-Version': baseparams['X-Plex-Version'],
          'X-Plex-Client-Identifier': baseparams['X-Plex-Client-Identifier'],
          'X-Plex-Platform': baseparams['X-Plex-Platform'],
          'X-Plex-Platform-Version': baseparams['X-Plex-Platform-Version'],
          'X-Plex-Device': baseparams['X-Plex-Device'],
          'X-Plex-Device-Name': baseparams['X-Plex-Device-Name'],
          'X-Plex-Device-Screen-Resolution': baseparams['X-Plex-Device-Screen-Resolution'],
          'X-Plex-Token': baseparams['X-Plex-Token']
        }
        var query = '';
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }
        let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
        this.ready = false
        let options = {
          method: 'PUT',
          url: url
        }
        request(options, function (error, response, body) {
          if (!error) {
            return callback(true)
          }
          return callback(false)
          //console.log(error)
        })
      },
      getInitAudioTrackIndex: function (){
        console.log('Fetching audio track')
        // Load preferences from file
        if (!this.playingMetadata || this.playingMetadata.type != 'episode'){
          console.log('Error with playingMetadata or content type when fetching audio track preference')
          return 0
        }
        let prefLanguage = this.getPreference('audio',this.playingMetadata.grandparentKey)
        console.log('Our audio preference for this series is ' + prefLanguage)
        let tracks = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream
        console.log('Tracks: ', tracks)
        for (let i = 0; i < tracks.length; i++){
          if (prefLanguage == tracks[i].languageCode && tracks[i].streamType == 2){
            return i
          }
        }
        console.log('No preference for ' + this.playingMetadata.grandparentKey)
        return false
      },      
      getInitSubtitleTrackIndex: function (){
        console.log('Fetching subtitle track')
        // Load preferences from file
        if (!this.playingMetadata || this.playingMetadata.type != 'episode'){
          console.log('Error with playingMetadata or content type when fetching subtitle track preference', this.playingMetadata.type, this.playingMetadata)
          return 0
        }
        let tracks = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream
        let prefLanguage = this.getPreference('subs',this.playingMetadata.grandparentKey)
        console.log('Our subtitle preference for this series is ' + prefLanguage)
        for (let i = 0; i < tracks.length; i++){
          if (prefLanguage == tracks[i].languageCode && tracks[i].streamType == 3){
            return i
          }
        }
        console.log('No preference for ' + this.playingMetadata.grandparentKey)
        return false
      },  
      openModal () {
        return this.$refs.playersettingsModal.open()
      },
      savePrefence (type, ratingKey, preference){
        let oldSettings = JSON.parse(localStorage.getItem('PTPLAYERPREFS-' + type))
        if (!oldSettings){
          oldSettings = {}
        }
        oldSettings[ratingKey] = preference
        localStorage.setItem('PTPLAYERPREFS-' + type, JSON.stringify(oldSettings))
      },      
      getPreference (type, ratingKey){
        let oldSettings = JSON.parse(localStorage.getItem('PTPLAYERPREFS-' + type))
        if (!oldSettings){
          return null
        }
        return oldSettings[ratingKey]
      },
      generateSources () {
        var that = this
        let qualityTemplate = function (label, resolution, bitrate, videoQuality) {
          var session = that.generateGuid()
          this.label = label
          this.initUrl = that.initTranscodeSessionUrl({
            "maxVideoBitrate": bitrate,
            "videoResolution": resolution,
            "videoQuality": videoQuality,
            "session": session
          })
          this.params = that.getBaseParams({
            "maxVideoBitrate": bitrate,
            "videoResolution": resolution,
            "videoQuality": videoQuality,
            "session": session
          })
          this.src = that.generateTranscodeUrl({
            "maxVideoBitrate": bitrate,
            "videoResolution": resolution,
            "videoQuality": videoQuality,
            "session": session
          })
          this.stopUrl = that.generateTranscodeStopUrl({
            "session": session
          })
          this.type = 'application/x-mpegURL'
        }
        let qualities = [
          new qualityTemplate('64 Kbps', '220x128', 64, 10),
          new qualityTemplate('96 Kbps', '220x128', 96, 20),
          new qualityTemplate('208 Kbps', '284x160', 208, 30),
          new qualityTemplate('320 Kbps', '420x240', 320, 30),
          new qualityTemplate('720 Kbps', '576x320', 720, 40),
          new qualityTemplate('1.5 Mbps 480p', '720x480', 1500, 60),
          new qualityTemplate('2 Mbps 720p', '1280x720', 2000, 60),
          new qualityTemplate('3 Mbps 720p', '1280x720', 3000, 75),
          new qualityTemplate('4 Mbps 720p', '1280x720', 4000, 100),
          new qualityTemplate('8 Mbps 1080p', '1920x1080', 8000, 60),
          new qualityTemplate('10 Mbps 1080p', '1920x1080', 10000, 75),
          new qualityTemplate('12 Mbps 1080p', '1920x1080', 12000, 90),
          new qualityTemplate('20 Mbps 1080p', '1920x1080', 20000, 100),
          new qualityTemplate('Original', null, null, null)
        ]
        return qualities
      },
      stopPlayback () {
        console.log('Stopped Playback')
        this.$store.commit('SET_DECISIONBLOCKED', false) 
        request(this.getSourceByLabel(this.chosenQuality).stopUrl, function (error, response, body) {})
        this.playerstatus = 'stopped'
        this.sessionId = this.generateGuid()
        this.xplexsession = this.generateGuid()
        this.chosenClient.pressStop(function () {

        })
      },
      changedPlaying: function (changeItem) {
        console.log('CHANGED PLAYING')
        var that = this
        this.ready = false
        this.$store.commit('SET_DECISIONBLOCKED', false)
        //console.log('Changed what we are meant to be playing!')
        if (!this.chosenKey || !this.chosenServer) {
          this.playerstatus = 'stopped'
          this.playerMetadata = null
          return
        }
        
        function req () {
          that.initDoneAudio = true      
          that.initDoneSubs = true
          var options = {
            headers: {
              accept: 'application/json'
            },
            url: that.getSourceByLabel(that.chosenQuality).initUrl
          }
          console.log('Firing final transcode decision command')
          request(options, function (error, response, body) {
            if (error){
              return false
            }
            that.ready = true
            that.transcodeSessionMetadata = body
            /*parseXMLString(body, function (err, result) {
              if (err) {
                that.ready = false
              }

            })
            if (!error) {

            }*/
          })
        }

        if (this.playingMetadata) {
          request(this.getSourceByLabel(this.chosenQuality).stopUrl, function (error, response, body) {
            // We dont need to know what this resulted in
          })
        }
        if (changeItem) {
          this.playingMetadata = null
          this.chosenServer.getMediaByRatingKey(this.chosenKey, (result) => {
            //console.log(result)
            this.playingMetadata = result
            this.sources = that.generateSources()
            this.chosenAudioTrackIndex = this.getInitAudioTrackIndex() || -1000
            this.chosenSubtitleIndex = this.getInitSubtitleTrackIndex() || -1000

            let count = 0
            let done = 0
            if (this.chosenAudioTrackIndex != -1000){

              count++
              this.changeAudioTrack(() => {          
                done++
                if (done == count){
                  req()
                }
              })
            }            
            if (this.chosenSubtitleIndex != -1000){

              count++
              this.changeSubtitleTrack(() => {
                done++
                if (done == count){
                  req()
                }
              })
            }

            if (count == 0){      
              req()
            }
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
      playerSeekDone (data) {
      },
      generateTranscodeUrl (overrideparams) {
        let params = this.getBaseParams(overrideparams)

        var query = '';
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }
        let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/start.m3u8?' + query
        //console.log(url)
        return url
      },
      generateTranscodeStopUrl (overrideparams) {
        let params = {
          session: this.sessionId,
          'X-Plex-Product': 'PlexTogether',
          'X-Plex-Version': '3.4.1',
          'X-Plex-Client-Identifier': 'PLEXTOGETHERWEB',
          'X-Plex-Platform': this.browser,
          'X-Plex-Platform-Version': '57.0',
          'X-Plex-Device': 'Windows',
          'X-Plex-Device-Screen-Resolution': window.screen.availWidth + 'x' + window.screen.availHeight,
          'X-Plex-Token': this.chosenServer.accessToken,
        }
        for (let key in overrideparams) {
          if (!overrideparams[key]) {
            delete params[key]
          } else {
            params[key] = overrideparams[key]
          }
        }
        var query = '';
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }
        let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/stop?' + query
        //console.log(url)
        return url
      },
      initTranscodeSessionUrl (overrideparams) {
        // We need to tell the Plex Server to start transcoding
        let params = this.getBaseParams(overrideparams)

        var that = this
        var query = '';
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }
        let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/decision?' + query
        return url
      },
      getBaseParams (overrideparams) {
        let location = 'wan'
        if (this.plex.getServerById(this.playingMetadata.machineIdentifier).publicAddressMatches == '1') {
          location = 'lan'
        }
        let params = {
          hasMDE: 0,
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
          //offset: Math.round(this.playertime / 1000),
          subtitles: 'burn',
          copyts: 1,
          'Accept-Language': 'en',
          'X-Plex-Session-Identifier': this.xplexsession,
          'X-Plex-Chunked': 1,
          'X-Plex-Product': 'PlexTogether',
          'X-Plex-Version': '3.4.1',
          'X-Plex-Client-Identifier': 'PLEXTOGETHERPLAYER',
          'X-Plex-Platform': 'PlexTogether',
          'X-Plex-Platform-Version': '57.0',
          'X-Plex-Device': 'HTML TV App',
          'X-Plex-Device-Name': 'PlexTogether Player',
          'X-Plex-Device-Screen-Resolution': window.screen.availWidth + 'x' + window.screen.availHeight,
          'X-Plex-Token': this.chosenServer.accessToken,
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
        // We need to tell the PMS about our player every 20s
        var that = this

        function send () {
          let params = {
            'deviceClass': 'pc',
            'protocolCapabilities': 'playback',
            'protocolVersion': '1',
            'timeout': 1,
            'X-Plex-Product': 'PlexTogether',
            'X-Plex-Version': '3.4.1',
            'X-Plex-Client-Identifier': 'PLEXTOGETHERPLAYER',
            'X-Plex-Platform': that.browser,
            'X-Plex-Platform-Version': '57.0',
            'X-Plex-Device': 'Windows',
            'X-Plex-Device-Name': 'PlexTogetherPlayer',
            'X-Plex-Device-Screen-Resolution': window.screen.availWidth + 'x' + window.screen.availHeight,
            'X-Plex-Token': that.chosenServer.accessToken,

          }
          var query = '';
          for (let key in params) {
            query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
          }
          let url = that.chosenServer.chosenConnection.uri + '/player/proxy/poll?' + query
          let headers = {
            Accept: 'text/plain, */*; q=0.01',
            'Accept-Language': 'en'
          }
          let options = {
            url: url,
            headers: headers
          }
          request(url, function (error, response, body) {
          })
        }

        setInterval(function () {
          //send()
        }, 20000)
        //send()
      },
      generateGuid () {
        function s4 () {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }

        return s4() + s4() + s4() + s4();
      },
      getBrowser () {
        var sBrowser, sUsrAg = navigator.userAgent;
        if (sUsrAg.indexOf("Chrome") > -1) {
          sBrowser = "Chrome";
        } else if (sUsrAg.indexOf("Safari") > -1) {
          sBrowser = "Safari";
        } else if (sUsrAg.indexOf("Opera") > -1) {
          sBrowser = "Opera";
        } else if (sUsrAg.indexOf("Firefox") > -1) {
          sBrowser = "Firefox";
        } else if (sUsrAg.indexOf("MSIE") > -1) {
          sBrowser = "Microsoft Internet Explorer";
        }
        return sBrowser
      }

    }

  }
</script>

