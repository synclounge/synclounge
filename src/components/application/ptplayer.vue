<template>
	<div style="height: 100%">
        <videoplayer v-if="playingMetadata && chosenServer && chosenQuality && ready"
            @playerMounted="playerMounted()"
            @timelineUpdate="timelineUpdate"



            :metadata="playingMetadata"
            :server="chosenServer"
            :src="getSourceByLabel(chosenQuality)"
            :initUrl="getSourceByLabel(chosenQuality).initUrl"               
            :params="getSourceByLabel(chosenQuality).params"   
            :initialOffset="offset"
            :createdAt="playerCreatedAt"
        ></videoplayer>
        <div class="row">
            <div v-if="playingMetadata && chosenServer" class="input-field col l3 s12">
                <v-select name="select"
                            id="select"
                            v-model="chosenMediaIndex"
                            :items="mediaIndexSelect"
                ></v-select>
                <label for="select">Version</label>
            </div>            
            <div v-if="playingMetadata && chosenServer" class="input-field col l3 s12">
                <v-select name="select"
                            id="select"
                            v-model="chosenQuality"
                            :items="qualitiesSelect"
                ></v-select>
                <label for="select">Quality</label>
            </div>            
            <div v-if="playingMetadata && chosenServer" class="input-field col l3 s12">
                <v-select name="select"
                            id="select"
                            v-model="chosenAudioTrackIndex"
                            :select-text="'Default'"
                            :items="audioTrackSelect"
                ></v-select>
                <label for="select">Audio</label>
            </div>            
            <div v-if="playingMetadata && chosenServer" class="input-field col l3 s12">
                <v-select name="select"
                            id="select"
                            v-model="chosenSubtitleIndex"
                            :select-text="'Default'"
                            :items="subtitleTrackSelect"
                ></v-select>
                <label for="select">Subtitles</label>
            </div>
        </div>
    </div>
</template>
 
<script>
// CSS imports


var request = require('request')
var parseXMLString = require('xml2js').parseString;

// Components
import videoplayer from './ptplayer/videoplayer.vue'

import { SweetModal, SweetModalTab } from 'sweet-modal-vue'



export default {
    name: 'ptplayer',
    components: {
        videoplayer
    },
    created(){        
        $(document).ready(function() {
            $('select').material_select();
        });
    },
    mounted: function(){ 
        var that = this
        

        // Similuate a real plex client
        this.eventbus.$on('command',function(data){
            if (data.command == '/player/timeline/poll'){
                let key = null
                let ratingKey = null
                if (that.playingMetadata){
                    key = that.playingMetadata.key
                    ratingKey = that.playingMetadata.ratingKey
                }
                let machineIdentifier = null
                if (that.chosenServer){
                    machineIdentifier = that.chosenServer.clientIdentifier
                }
                let playerdata = {                    
                    key: key,
                    ratingKey: ratingKey,
                    time: that.playertime,
                    type: 'video',
                    machineIdentifier: machineIdentifier,
                    duration: that.playerduration,
                    state: that.playerstatus
                }
                return data.callback(playerdata)
            }
            if (data.command == '/player/playback/play'){
                that.eventbus.$emit('player-press-play', function(res){
                    return data.callback(res)
                })
                return
            }
            if (data.command == '/player/playback/pause'){
                that.eventbus.$emit('player-press-pause',function(res){
                    return data.callback(res)
                })
                return
            }
            if (data.command == '/player/playback/stop'){
                that.ready = false
                that.chosenKey = 0
                that.chosenServer = null
                return data.callback(true)
            }
            if (data.command == '/player/playback/seekTo'){
                console.log('Recieved a seek')
                if (Math.abs(that.playertime - data.params.offset ) > 10000 || that.playerTime > data.params.offset){
                    console.log('Jump seeking')
                    that.playertime = data.params.offset
                    that.changedPlaying(false)
                    let checker = setInterval(function(){
                        console.log('Waiting for the player to start before returning seek result')
                        if (that.playerstatus == 'playing'){
                            clearInterval(checker)
                            return data.callback(true)
                        }
                    },1000)
                } else {
                    that.eventbus.$emit('player-seek', {
                        time: data.params.offset,
                        callback: function(res){
                            console.log('Player reported a seek result of ' + res)
                            data.callback(res)
                        }
                    })
                }
                return
            }
            if (data.command == '/player/playback/playMedia'){
                console.log
                that.chosenKey = data.params.key.replace('/library/metadata/','')
                that.chosenServer = that.plex.getServerById(data.params.machineIdentifier)
                that.playertime = data.params.offset
                return data.callback(true)
            }
            console.log('Unable to process the remote control command ' + data.command)
        })

         
    },
    created: function(){    
    },
    data () {
        return {
            eventbus: window.EventBus,

            offset: 0,
            chosenKey: null, // The item we are going to be playing from the chosen server eg. 12345
            chosenServer: null, // The Plex Media Server we are going to play from

            // Content can have multiple copies 
            // Below are options chosen for each copy 
            chosenMediaIndex: 0, // The index of the item we want to play
            chosenQuality: 'Original', // The quality profile
            chosenSubtitleIndex: 0, // Subtitle track index
            chosenAudioTrackIndex: 0, // Audio track index 
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
            transcodeSessionMetadata: {}
        }
    },
    watch: {
        chosenKey: function(){
            this.changedPlaying(true)
        },
        chosenServer: function(){
            this.changedPlaying(true)
        },
        chosenQuality: function(){
            this.changedPlaying(false)
        },    
        chosenMediaIndex: function(){
            this.chosenSubtitleIndex = 0
            this.chosenAudioTrackIndex = 0
            this.changedPlaying(false)
        },                    
        chosenAudioTrackIndex: function(){
            console.log('Audio track change')
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
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
            this.ready = false
            let options = {
                method: 'PUT',
                url: url
            }
            request(options, function(error,response,body){
                if (!error){
                    that.changedPlaying(false)
                    return
                }
                console.log(error)
            })

        },        
        chosenSubtitleIndex: function(){
            console.log('Subtitle track change')
            var that = this
            let subtitleStreamID = 0
            if (this.chosenSubtitleIndex > -1){
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
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            let url = this.chosenServer.chosenConnection.uri + '/library/parts/' + this.playingMetadata.Media[this.chosenMediaIndex].Part[0].id + '?' + query
            this.ready = false
            let options = {
                method: 'PUT',
                url: url
            }
            request(options, function(error,response,body){
                if (!error){
                    that.changedPlaying(false)
                    return
                }
                console.log(error)
            })

        }
    },
    computed:{       
        plex: function(){
            return this.$store.getters.getPlex
        }, 
        chosenCombo: function(){
            // Helper for our watch chosenCombo
            return this.chosenKey || chosenServer
        }, 
        mediaIndexSelect(){
            let mediaDone = []
            if (!this.playingMetadata){
                return mediaDone
            }
            for (let i = 0; i < this.playingMetadata.Media.length; i++){
                let current = this.playingMetadata.Media[i]
                mediaDone.push({
                    id: i,
                    text: current.videoResolution + 'p  ('  + current.videoCodec + ' ' + current.bitrate + 'kbps)'
                })
            }
            return mediaDone
        },        
        audioTrackSelect(){
            let audioTracks = []
            if (!this.playingMetadata){
                return audioTracks
            }
            if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1){
                return audioTracks
            }
            for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++){
                let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
                if (current.streamType == 2){
                    audioTracks.push({
                        id: i,
                        text: current.language + ' (' + current.codec.toUpperCase() + ' ' + current.audioChannelLayout.toUpperCase() + ')'
                    })
                }

            }
            return audioTracks
        },        
        subtitleTrackSelect(){
            let subtitleTracks = []
            if (!this.playingMetadata){
                return subtitleTracks
            }
            if (this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length == 1){
                return subtitleTracks
            }            
            subtitleTracks.push({
                id: -1,
                text: 'None'
            })
            for (let i = 0; i < this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream.length; i++){
                let current = this.playingMetadata.Media[this.chosenMediaIndex].Part[0].Stream[i]
                if (current.streamType == 3){
                    subtitleTracks.push({
                        id: i,
                        text: current.language + ' (' + current.codec.toUpperCase() + ')'
                    })
                }

            }

            return subtitleTracks
        },
        qualitiesSelect(){
            let sourcesDone = []
            for (let i = 0; i < this.sources.length; i++){
                sourcesDone.push({
                    id: this.sources[i].label,
                    text: this.sources[i].label
                })
            }
            return sourcesDone
        },
        xplexsession(){
            return this.generateGuid()
        }



    },
    methods: {
        playerMounted: function(){
            var that = this
            console.log('Child player said it is mounted')
        }, 
        getSourceByLabel: function(label){
            for (let i = 0; i < this.sources.length; i++){
                let source = this.sources[i]
                if (source.label == label){
                    return source
                }
            }
            return null
        },     
        generateSources(){
            var that = this
            let qualityTemplate = function(label,resolution,bitrate,videoQuality){
                var session = that.generateGuid()
                this.label = label
                this.initUrl = that.initTranscodeSessionUrl({
                    "maxVideoBitrate": bitrate,
                    "videoResolution": resolution,
                    "videoQuality": videoQuality,
                    "session":session
                })
                this.params = that.getBaseParams({
                    "maxVideoBitrate": bitrate,
                    "videoResolution": resolution,
                    "videoQuality": videoQuality,
                    "session":session
                })
                this.src = that.generateTranscodeUrl({
                    "maxVideoBitrate": bitrate,
                    "videoResolution": resolution,
                    "videoQuality": videoQuality,
                    "session":session
                })                
                this.stopUrl = that.generateTranscodeStopUrl({
                    "session":session
                })
                this.type = 'video/mp4'
            }
            let qualities = [
                new qualityTemplate('64 Kbps','220x128',64,10),
                new qualityTemplate('96 Kbps', '220x128',96,20),
                new qualityTemplate('208 Kbps', '284x160',208,30),
                new qualityTemplate('320 Kbps', '420x240',320,30),
                new qualityTemplate('720 Kbps', '576x320',720,40),
                new qualityTemplate('1.5 Mbps 480p', '720x480',1500,60),
                new qualityTemplate('2 Mbps 720p', '1280x720',2000,60),
                new qualityTemplate('3 Mbps 720p', '1280x720', 3000,75),
                new qualityTemplate('4 Mbps 720p', '1280x720',4000,100),
                new qualityTemplate('8 Mbps 1080p', '1920x1080',8000,60),
                new qualityTemplate('10 Mbps 1080p','1920x1080',10000,75),
                new qualityTemplate('12 Mbps 1080p','1920x1080',12000,90),
                new qualityTemplate('20 Mbps 1080p', '1920x1080',20000,100),
                new qualityTemplate('Original',null,null,null)
            ]
            return qualities
        },
        changedPlaying: function(changeItem){
            var that = this
            this.ready = false
            console.log('Changed what we are meant to be playing!')
            if (!this.chosenKey || !this.chosenServer){
                this.playerMetadata = null
                return
            }
            function req(){
                that.sources = that.generateSources()    
                request(that.getSourceByLabel(that.chosenQuality).initUrl, function (error, response, body) {
                    console.log('Got response')
                    console.log(body)
                    parseXMLString(body, function(err,result){
                        if (err){
                            that.ready = false
                        }
                        that.ready = true
                        that.transcodeSessionMetadata = result

                    })
                    if (!error) {
                        
                    }
                }) 
            }
            if (changeItem){
                this.chosenServer.getMediaByRatingKey(this.chosenKey,function(result){
                    console.log(result)
                    that.playingMetadata = result      
                    req()
                })    
            } else {
                req()
            }
    

            if (this.playingMetadata){
                console.log('We should fire our closing event')
                request(this.getSourceByLabel(this.chosenQuality).stopUrl, function (error, response, body) {
                }) 
            }
        },
        timelineUpdate(data){
            //console.log("Got timeline update from player")
            //console.log(data)
            this.playertime = data.time 
            this.playerstatus = data.status
            this.bufferedTill = data.bufferedTill
            this.playerduration = data.duration
        },
        playerSeekDone(data){
        },
        generateTranscodeUrl(overrideparams){            
            let params = this.getBaseParams(overrideparams)
      
            var query = '';
            for (let key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/start?' + query 
            //console.log(url)
            return url
        },        
        generateTranscodeStopUrl(overrideparams){            
            let params = {
                session: this.sessionId,
                'X-Plex-Product': 'PlexTogether',
                'X-Plex-Version': '3.4.1',
                'X-Plex-Client-Identifier': 'PLEXTOGETHERWEB',
                'X-Plex-Platform':'Chrome',
                'X-Plex-Platform-Version':'57.0',
                'X-Plex-Devices': 'Windows',
                'X-Plex-Device-Screen-Resolution':'2560x1440',
                'X-Plex-Token': this.chosenServer.accessToken,
            }         
            for (let key in overrideparams) {
                if (!overrideparams[key]){
                    delete params[key]
                } else {
                    params[key] = overrideparams[key]
                }
            } 
            var query = '';
            for (let key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/stop?' + query 
            //console.log(url)
            return url
        },
        initTranscodeSessionUrl(overrideparams){
            // We need to tell the Plex Server to start transcoding            
            let params = this.getBaseParams(overrideparams)

            var that = this
            var query = '';
            for (let key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            let url = this.chosenServer.chosenConnection.uri + '/video/:/transcode/universal/decision?' + query 
            return url
        },
        getBaseParams(overrideparams){
            let params = {
                hasMDE: 1,
                path: this.playingMetadata.key,
                mediaIndex: this.chosenMediaIndex,
                partIndex: 0,
                protocol: 'http',
                fastSeek: 1,
                directPlay: 0,
                directStream: 1,
                subtitleSize: 100,
                audioBoost: 100,
                location: 'lan',
                session: this.sessionId,
                offset: Math.round(this.playertime / 1000),
                subtitles: 'burn',
                copyts: 1,
                'Accept-Language': 'en',
                'X-Plex-Session-Identifier':this.xplexsession,
                'X-Plex-Chunked': 1,
                'X-Plex-Product': 'PlexTogether',
                'X-Plex-Version': '3.4.1',
                'X-Plex-Client-Identifier': 'PLEXTOGETHERPLAYER',
                'X-Plex-Platform':'Chrome',
                'X-Plex-Platform-Version':'57.0',
                'X-Plex-Device': 'Windows',
                'X-Plex-Device-Name': 'PlexTogetherPlayer',
                'X-Plex-Device-Screen-Resolution':'2560x1440',
                'X-Plex-Token': this.chosenServer.accessToken,
            }         
            for (let key in overrideparams) {
                if (!overrideparams[key]){
                    delete params[key]
                } else {
                    params[key] = overrideparams[key]
                }
            } 
            return params   
        },
        sendPMSPoll(){
            // We need to tell the PMS about our player every 20s
            var that = this
            function send(){
                console.log('Sending PMS our details')
                let params = {       
                    'deviceClass': 'pc',
                    'protocolCapabilities': 'playback',
                    'protocolVersion':'1',
                    'timeout': 1,     
                    'X-Plex-Product': 'PlexTogether',
                    'X-Plex-Version': '3.4.1',
                    'X-Plex-Client-Identifier': 'PLEXTOGETHERPLAYER',
                    'X-Plex-Platform':'Chrome',
                    'X-Plex-Platform-Version':'57.0',
                    'X-Plex-Device': 'Windows',
                    'X-Plex-Device-Name': 'PlexTogetherPlayer',
                    'X-Plex-Device-Screen-Resolution':'2560x1440,2560x1440',
                    'X-Plex-Token': that.chosenServer.accessToken,

                }              
                var query = '';
                for (let key in params) {
                    query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
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
                request(url,function(error,response,body){
                    console.log('Poll result: ' + error)
                })
            }
            setInterval(function(){
                //send()
            },20000)
            //send()
        },
        generateGuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + s4() + s4();
        }  

    }
    
}
</script>

