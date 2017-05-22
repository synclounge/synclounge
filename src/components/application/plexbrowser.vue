<template>
    <div> 
        <span v-if="browsingServer || selectedItem">            
            <span v-on:click="reset()" class="material-icons" style="padding-left:1%">home</span>
        </span>
        <div v-if="!browsingServer && !selectedItem">
            <div v-if="!selectedItem && !browsingServer" class="row"  style="height:100%; width:100%; overflow-y:auto; padding:1%">
                <div style="padding-bottom:5%">
                    <h2> Search </h2>
                    <div v-if="!browsingContent">
                        <input v-model="searchWord" id="search" type="text">                
                        <label for="search">Keyword</label>                        
                    </div>
                    <v-progress-circular v-if="searching && serversResponded != plex.servers.length" small active></v-progress-circular>  
                </div>
                <div v-if="results && (results.length > 0 && !selectedItem)">
                    <div v-if="filteredMovies.length > 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                        <h3> Movies ({{filteredMovies.length}}) </h3>
                        <v-card v-on:click.native="setContent(content)" v-for="content in filteredMovies"  class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:350px">
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
                    <div v-if="filteredShows.length > 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                        <h3> TV Shows ({{filteredShows.length}}) </h3>
                        <v-card v-on:click.native="setContent(content)" v-for="content in filteredShows"  class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:350px">
                            <div style="height:100%;bottom:0">
                                <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                                <div style="padding:3%; padding-left:1%; height:25%;">
                                    <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                                    <div> 
                                        <label style="display:block"> {{ content.childCount }} seasons </label> 
                                        <label style="display:block"> {{ content.server.name }} </label> 
                                    </div>
                                </div>
                            </div>
                        </v-card>
                    </div>
                    <div v-if="filteredSeasons.length > 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                        <h3> Seasons ({{filteredSeasons.length}})</h3>
                        <v-card v-on:click.native="setContent(content)" v-for="content in filteredSeasons"  class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:350px">
                            <div style="height:100%;bottom:0">
                                <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                                <div style="padding:3%; padding-left:1%; height:25%;">
                                    <span style="font-size: 1vh;" class="card-title truncate">{{content.grandParentTitle }} - S{{ content.title }}</span>
                                    <div> 
                                        <label style="display:block"> {{ content.childCount }} episodes </label> 
                                        <label style="display:block"> {{ content.server.name }} </label> 
                                    </div>
                                </div>
                            </div>
                        </v-card>
                    </div>            
                    <div v-if="filteredEpisodes.length > 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                        <h3> Episodes ({{filteredEpisodes.length}})</h3>
                        <v-card v-on:click.native="setContent(content)" v-for="content in filteredEpisodes"  class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:350px">
                            <div style="height:100%;bottom:0">
                                <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                                <div style="padding:3%; padding-left:1%; height:25%;">
                                    <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                                    <div> 
                                        <label style="display:block"> {{ content.grandparentTitle }} </label> 
                                        <label style="display:block"> S{{ content.parentIndex }}E{{ content.index}} </label> 
                                        <label style="display:block"> {{ content.server.name }} </label> 
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
                            <div class="col s3 l4" style="height:100%">
                                <img src="static/plexlogo.png" style="height:100%; width:100%" >
                            </div>
                            <div class="col s9 l8">
                                <div style="font-size: 2vh;">{{ server.name }}</div>
                                <label style="font-size: 1vh;">
                                v{{ server.productVersion }}
                                </label>
                                <div style="font-size: 1vh;"> Owned by {{ ownerOfServer(server) }}</div>
                            </div>
                        </v-card>
                    </div>
                </div>
            </div>
        </div>
        <span v-if="selectedItem">
            <plexcontent v-if="selectedItem.type == 'episode' || selectedItem.type == 'movie'" :server="selectedItem.server" :content="selectedItem">
            </plexcontent>            
            <plexseason v-if="selectedItem.type == 'series'" :server="selectedItem.server" :content="selectedItem">
            </plexseason>            
            <plexseries v-if="selectedItem.type == 'show'" :server="selectedItem.server" :content="selectedItem">
            </plexseries>
        </span>
        <plexserver v-if="browsingServer" :server="browsingServer" style="height:100%; width:100%; overflow-y:auto; padding:1%">
        </plexserver> 
    </div>
</template>

<script>    
import plexserver from './plexbrowser/plexserver'
import plexcontent from './plexbrowser/plexcontent'
import plexlibrary from './plexbrowser/plexlibrary'
import plexseason from './plexbrowser/plexseason'
import plexseries from './plexbrowser/plexseries'



var _ = require('lodash');

export default {
    props: ['plexbrowser'],
    components: {
        plexserver,
        plexcontent,
        plexlibrary,
        plexseason,
        plexseries
    },
    name: 'plexbrowser',
    methods: {
        setContent(content){
            this.selectedItem = content
        },
        setServer(server){
            this.browsingServer = server
        },
        reset(){
            console.log('resetting')
            this.browsingServer = false
            this.selectedItem = false
            this.results = []
            this.searchWord = ''
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
            return object.server.getUrlForLibraryLoc(object.thumb,w/6, h/4)
        },
        searchAllServers: _.debounce(
            function () {
                this.searching = true
                var vm = this
                this.results = []
                this.serversResponded = 0
                for (let i = 0; i < this.plex.servers.length; i++){
                    let server = this.plex.servers[i]
                    server.search(this.searchWord,(serverSearchResults) => {
                        this.serversResponded++
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
          selectedItem: null,

          results: [],
          searchWord: '',
          searchStatus: '',
          searching: false
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

