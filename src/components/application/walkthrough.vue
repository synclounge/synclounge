<template>
    <div class="container" style="padding: 10px; font-family:'Open Sans', sans-serif !important;">
        <div class="row">
            <div class="col s8 offset-s2 l4 offset-l4" style="text-align:center;padding-top:1%">
                <img style="max-width:100%" v-bind:src="logo">
            </div>
        </div> 
        <div v-if="!chosenClient">                  
            <div class="row"  v-if="plex && plex.gotDevices">
                <h4 style="text-align:center" class="col s12 l4 offset-l4">Connect to your Plex Client</h4>
            </div>
            <div class="row" v-if="plex && plex.gotDevices && plex.clients.length > 0">
                <div class="col s12 l6 offset-l3" v-bind:style="{ opacity: step1Complete }">
                    Choose a client from the list below. Once you've found the client you would like to use, click the connect button below. Plex Together will test to see if it can connect with the client and will let you know if it cannot.
                </div>       
            </div>  
            <div class="row" v-if="plex && plex.gotDevices && plex.clients.length == 0">
                <div class="col s12 l6 offset-l3" v-bind:style="{ opacity: step1Complete }">
                    Unfortunately Plex Together couldn't find any players on Plex.tv. Plex.tv periodically forgets your clients so you need to have the client open and signed in to the same Plex user.                    
                    If Plex Together still cannot find your client, try playing something. This usually forces the client to appear on Plex.tv.
                    <br><br>
                    You can force Plex Together to retrieve the latest data from Plex.tv by clicking <a v-on:click="refreshPlexDevices()"> here </a>     

                </div>    
            </div>
            <div class="row">
                
            </div>
            <div class="row" v-if="plex && plex.gotDevices && plex.clients.length > 0">
                <div class="col s12 l4 offset-l3">
                    <div v-if="plex" id="plexPlayers">                
                        <div class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text" href="#">
                            Plex Players {{ playercount }}
                        </div>     
                        <div v-for="i in plex.clients">
                            <div v-on:click="previewClient(i)">
                               <plexclient :startup="testClient" :sidebar="false" :selected="isClientSelected(i)" :object="i" style="cursor: pointer"></plexclient>                                
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="testClient" class="col s12 l2">                       
                    <div class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text" href="#">
                        Selected Player
                    </div>    
                    <h3 style="margin-top: 0; margin-bottom: 5px;opacity:1">{{ testClient.name }}</h3>                      
                    <div>    
                        <label>Last seen</label><span>  {{ lastSeenAgo(testClient.lastSeenAt) }}</span>
                    </div>                   
                    <div>    
                        <label>Device</label><span>  {{ testClient.device }}</span>
                    </div> 
                    <div>
                        <label>Running</label><span v-tooltip="testClient.productVersion">  {{ testClient.product }} </span>
                    </div>            
                    <div style="padding-bottom:2%">
                        <label>Platform</label><span v-tooltip="testClient.platformVersion">  {{ testClient.platform }} </span>
                    </div> 
                    <div v-if="testClientWaiting" class="center">
                        <v-progress-circular :class="spinner-plex-orange-only" small active></v-progress-circular>
                    </div>                    
                    <div v-if="!testClientWaiting">
                        <button :disabled="!testClient" v-on:click="clientClicked()" v-bind:style="{ opacity: upToStep2 }" class="btn-large mdc-button mdc-button--raised mdc-button--accent plex-gamboge ptsettings" style="width: 100%">
                            Connect
                        </button>   
                    </div>                    
                    <div v-if="testClient.product.indexOf('Web') > -1">
                        Note: Plex Web is currently not supported
                    </div>   
                    <div v-if="testClientErrorMsg">
                        {{ testClientErrorMsg }}
                    </div>          
                </div>
            </div>
            

        </div>      
        <div v-if="chosenClient">   
            <div class="row">
                <div class="col s12 l12" v-bind:style="{ opacity: upToStep2 }">
                    <h4 style="text-align:center">Join your Plex Together room</h4>
                </div>
            </div>
            <div class="row">
                <div class="col s12 l6 offset-l3" v-bind:style="{ opacity: upToStep2 }">
                    It's time to join a server and then a room. Decide with your friends what server and room to join and then click the Join Room button below. If you're hosting your
                own server make sure you choose a custom server.
                </div>        
            </div>
            <div class="row">
                <div class="col s12 l4 offset-l4">
                    <button :disabled="!chosenClient" v-on:click="openJoinRoomModal()" v-bind:style="{ opacity: upToStep2 }" class="btn-large mdc-button mdc-button--raised mdc-button--accent plex-gamboge ptsettings" style="width: 100%">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import plexclient from './plexclient'
import plexserver from './plexserver'

import moment from '../../../node_modules/moment/moment.js'

export default {
    props: ['object'],
    name: 'walkthrough',
    data() {
        return {
            testClient: null
        }
    },
    components: {        
      plexclient,
      plexserver,
    },
    computed: {
        chosenClient: function(){
            return this.$store.getters.getChosenClient
        },
        plex: function(){
            return this.$store.getters.getPlex
        },  
        context: function(){
            return this.$store
        },
        logo: function(){
            return 'static/logo-long-light.png'
        },       
        playercount: function(){
            if (this.$store.state.plex && this.$store.state.plex.gotDevices){
                return '(' + this.$store.state.plex.clients.length + ')'
            }
            return ''
        },
        testClientWaiting: function(){
            if (this.testClient.connectedstatus == 'waiting'){
                return true
            } return false
        },
        testClientErrorMsg: function(){
            if (this.testClient.connectedstatus == 'failed'){
                return 'Error connecting to client'
            } return false
        }
    },
    methods: {
        previewClient: function(client){
            this.testClient = client
        },
        clientClicked:function(){         
            let client = this.testClient  
            let clients = this.$store.getters.getPlex.clients            
            for (let i = 0; i < clients.length; i++) {
                let _client = clients[i]
                if (_client.connectedstatus == 'waiting'){
                    return
                }
            }
            for (let i = 0; i < clients.length; i++) {
                let _client = clients[i]
                _client.connectedstatus = 'fresh'
            }
            //this.$store.state.plex.chosenClient = null
            client.connectedstatus = 'waiting'
            let that = this
            client.findConnection(function(res){
                let plexObj = that.$store.state.plex
                if (res){
                        client.connectedstatus = 'connected'
                        that.$store.commit('SET_CHOSENCLIENT',client)

                } else {
                    client.connectedstatus = 'failed'
                }
            })
        },       
        openJoinRoomModal: function(){
            return this.$parent.$refs.joinroomModal.open()
        },
        isClientSelected: function(client){
            if (client == this.testClient){
                return true
            }
            return false
        },
        lastSeenAgo: function(clientTime){              
            let now = moment(new Date().getTime())
            let end = moment.unix(parseInt(clientTime))
            let difference = moment.duration(now.diff(end))                    
            return difference.humanize() + ' ago'
        },
        refreshPlexDevices: function(){
            let oldClient = this.$store.getters.getChosenClient
            this.$store.commit('SET_CHOSENCLIENT',null)
            this.$store.commit('REFRESH_PLEXDEVICES')
        }
    }
}
</script>

