<template>
    <div style="height:100%; width:100%; overflow-y:auto; padding:1%" class="row">
        <h2 class="col l12"> Search </h2>
        <div v-if="!browsingContent" class="input-field col l12 ">
            <input v-model="searchWord" style="width:20%" id="search" type="text">
            <label for="search">Keyword</label>
        </div>
        <div v-if="searchStatus == 'Searching..'">
            <v-progress-circular small active></v-progress-circular>
        </div>
        <div v-if="results && results.length > 0" style="margin-top:10%" class="row">
            <div v-if="filteredMovies.length > 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                <h3> Movies ({{filteredMovies.length}}) </h3>
                <v-card v-on:click.native="setContent(content)" v-for="content in filteredMovies"  class="blue-grey darken-1 col l1 s4 hoverable" style="box-shadow:none;height:20vh">
                    <div style="height:100%">
                        <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                        <div style="margin:3%; margin-left:1%; height:25%;">
                            <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                            <div> 
                                <label style="display:block"> {{ content.year }}</label> 
                                <label> {{ content.server.name }} </label> 
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>            
            <div v-if="filteredShows.length > 0" class="row"> 
                <h3> TV Shows ({{filteredShows.length}}) </h3>
                <v-card v-on:click.native="setContent(content)" v-for="content in filteredShows"  class="blue-grey darken-1 col l1 s4 hoverable" style="padding:0.5%;box-shadow:none;height:20vh">
                    <div style="height:100%;bottom:0">
                        <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                        <div style="padding:3%; padding-left:1%; height:25%;">
                            <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                            <div> 
                                <label style="display:block"> {{ content.childCount }} seasons </label> 
                                <label> {{ content.server.name }} </label> 
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>
            <div v-if="filteredSeasons.length > 0" class="row"> 
                <h3> Seasons ({{filteredSeasons.length}})</h3>
                <v-card v-on:click.native="setContent(content)" v-for="content in filteredSeasons"  class="blue-grey darken-1 col l1 s4 hoverable" style="padding:0.5%;box-shadow:none;height:20vh">
                    <div style="height:100%;bottom:0">
                        <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                        <div style="padding:3%; padding-left:1%; height:25%;">
                            <span style="font-size: 1vh;" class="card-title truncate">{{content.grandParentTitle }} - S{{ content.title }}</span>
                            <div> 
                                <label style="display:block"> {{ content.childCount }} episodes </label> 
                                <label> {{ content.server.name }} </label> 
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>            
            <div v-if="filteredEpisodes.length > 0" class="row"> 
                <h3> Episodes ({{filteredEpisodes.length}})</h3>
                <v-card v-on:click.native="setContent(content)" v-for="content in filteredEpisodes"  class="blue-grey darken-1 col l1 s4 hoverable" style="padding:0.5%;box-shadow:none;height:20vh">
                    <div style="height:100%;bottom:0">
                        <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                        <div style="padding:3%; padding-left:1%; height:25%;">
                            <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                            <div> 
                                <label style="display:block"> {{ content.grandparentTitle }} </label> 
                                <label style="display:block"> S{{ content.parentIndex }}E{{ content.index}} </label> 
                                <label> {{ content.server.name }} </label> 
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>
        </div>
        <div class="row">
            <h2> Browse </h2>
            <div v-if="!browsingServer" v-for="server in availableServers">
                <v-card v-on:click.native="setServer(server)" class="blue col s12 l3 hoverable" style="box-shadow:none">
                    <div class="col s3 l3" style="height:100%">
                        <img src="static/plexlogo.png" style="height:100%; width:100%" >
                    </div>
                    <div class="col s9 l9">
                        <div style="font-size: 1vh;">{{ server.name }}</div>
                        <label style="font-size: .7vh;">
                        v{{ server.productVersion }}
                        </label>
                        <div style="font-size: 1vh;"> Owned by {{ ownerOfServer(server) }}</div>
                    </div>
                </v-card>
            </div>
        </div>
        <plexserver v-if="browsingServer" :server="browsingServer">
        </plexserver>
    </div>
</template>

<script>    
import plexserver from './plexbrowser/plexserver'
var _ = require('lodash');
export default {
    props: ['plexbrowser'],
    components: {
        plexserver
    },
    name: 'plexbrowser',
    methods: {
        setContent(content){

        },
        setServer(server){
            this.browsingServer = server
        },
        ownerOfServer(server){
            if (server.owned == '1'){
                return 'you'
            } else {
                return server.sourceTitle
            }
        },        
        getThumb(object){
            console.log('Getting url for thumb ' + object.thumb)
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return object.server.getUrlForLibraryLoc(object.thumb,w/12, h/4)
        },
        searchAllServers: _.debounce(
            function () {
                this.searchStatus = 'Searching..'
                var vm = this
                this.results = []
                for (let i = 0; i < this.plex.servers.length; i++){
                    let server = this.plex.servers[i]
                    server.search(this.searchWord,(serverSearchResults) => {
                        console.log(serverSearchResults)
                        if (serverSearchResults){
                            for (let j = 0; j < serverSearchResults.length; j++){
                                serverSearchResults[j].server = server
                            }
                            this.results = this.results.concat(serverSearchResults)
                        }
                        this.searchStatus = 'Found ' + this.results.length + ' results'
                    })
                }
            },
            1000
        )
    },    
    data() {
      return {
          browsingServer: null,


          results: [],
          searchWord: '',
          searchStatus: ''
      }
    },
    watch: {
        searchWord(){
            if (this.searchWord == ''){
                return
            }
            this.searchAllServers()
        }
    },
    computed: {
        plex(){
            return this.$store.getters.getPlex
        },
        availableServers(){
            let servers = this.plex.servers.filter(function(server){
                if (server.chosenConnection){
                    return true
                }
                return false
            })
            return servers
        },
        filteredShows(){
            return this.results.filter((item) =>{
                if (item.type == 'show'){
                    return true
                }
                return false
            })
        },
        filteredEpisodes(){
            return this.results.filter((item) =>{
                if (item.type == 'episode'){
                    return true
                }
                return false
            })
        },
        filteredMovies(){
            return this.results.filter((item) =>{
                if (item.type == 'movie'){
                    return true
                }
                return false
            })
        },
        filteredSeasons(){
            return this.results.filter((item) =>{
                if (item.type == 'series'){
                    return true
                }
                return false
            })
        }
    }
}
</script>

