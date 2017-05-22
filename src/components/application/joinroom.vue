<template>
    <div class="container" style="padding: 10px; font-family:'Open Sans', sans-serif !important;">
        <div v-if="!context.getters.getConnected">        
            <div class="row" style="margin-bottom: 0;">
                <div class="col s12">
                    <h4 style="padding-bottom: 10px; padding-left: 0">Connect to a Plex Together Server</h4>
                </div>
            </div>
            <div class="row">            
                <div style="text-align:left" class="col s11">
                    <p > It's time to join a Plex Together Server. You can choose to join a server hosted by Plex Together or you can host your own.</p>
                    <p>  For details on how to host your own server click <a target="_blank" href="https://github.com/samcm/plextogether">here.</a> </p>
                </div>
                <div class="col s12">
                    <select v-model="selectedServer" v-on:change="attemptConnect()" id="PlexTogetherServers" class="mdc-select" v-bind:style="darkModeBackground" style="width: 100%">
                        <option value="" disabled>Select a PT Server</option>
                        <option value="custom">Custom</option>                        
                        <option v-bind:value="thisServer" >{{ thisServer }}</option>                       
                        <option value="https://au1.plextogether.com" >PlexTogether AU1</option>                        
                        <option value="https://us1.plextogether.com" >PlexTogether US1</option>
                        <option value="https://eu1.plextogether.com" >PlexTogether EU1</option>
                    </select>
                </div>
            </div>
            <div v-if="selectedServer == 'custom'" class="row" id="customField">
                <div class="col s11">
                    <div class="mdc-textfield mdc-textfield--upgraded" style="width: 100%">
                        <input v-model="CUSTOMSERVER" id="ptServerCustom" type="text" class="mdc-textfield__input" value="http://" style="width: 100%; margin-bottom: 0px">
                        <label class="mdc-textfield__label mdc-textfield__label--float-above plex-gamboge-text">
                            Custom Server
                        </label>
                    </div>
                </div>
                <div class="col s12" style="text-align: center; margin-top: 19px">
                    <button class="mdc-button mdc-button--raised mdc-button--accent plex-gamboge" v-on:click="attemptConnectCustom()" id="ptServerSubmit" type="submit" name="action" style="width:100%">Connect</button>
                </div>
            </div>
            <div class="valign-wrapper" v-if="serverError">
                <i style="color:red" class="valign material-icons">info_outline</i>  
                <span class="valign">  {{ serverError }}</span>
            </div> 
        </div>
        <div v-if="context.getters.getConnected">
            <div class="row" style="margin-bottom: 0;">
                <div class="col s12">
                    <div>
                        <h4 style="margin-bottom: 0; padding-left: 0">Join a Plex Together Room</h4>
                    </div>
                </div>
            </div>

            <div class="row" style="margin-bottom: 0;">
                <div class="col s12">
                    <div class="mdc-textfield mdc-textfield--upgraded" style="width: 100%">
                        <input v-on:keyup.enter="joinRoom()" v-model="room" id="ptRoom" type="text" class="mdc-textfield__input" style="margin-bottom: 0px;" autofocus>
                        <label class="mdc-textfield__label mdc-textfield__label--float-above plex-gamboge-text">
                            Room Name
                        </label>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col s12">
                    <div class="mdc-textfield mdc-textfield--upgraded" style="width: 100%">
                        <input v-on:keyup.enter="joinRoom()" v-model="password" id="ptRoomPassword" type="text" class="mdc-textfield__input" style="margin-bottom: 0px">
                        <label class="mdc-textfield__label mdc-textfield__label--float-above plex-gamboge-text">
                            Password
                        </label>
                    </div>
                </div>

                <div class="col s12	" style="text-align: center; margin-top: 19px">
                    <div class="progress-button">
                        <button class="mdc-button mdc-button--raised mdc-button--accent plex-gamboge" id="ptRoomJoin" v-on:click="joinRoom()" type="submit" name="action" style="width:100%">Join</button>
                    </div>
                </div>

                <div class="col s1">
                    <div class="preloader-wrapper small active" style="margin-top: 21px; margin-left:-27px; opacity:0">
                        <div class="spinner-layer spinner-plex-orange-only" id="ptRoomSubmitLoader">
                            <div class="circle-clipper left">
                                <div class="circle"></div>
                            </div>
                            <div class="gap-patch">
                                <div class="circle"></div>
                            </div>
                            <div class="circle-clipper right">
                                <div class="circle"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            
            <div class="valign-wrapper" v-if="roomError">
                <i style="color:red" class="valign material-icons">info_outline</i>  
                <span class="valign">  {{ roomError }}</span>
            </div> 
            </div> 
        </div>
    </div>
</template>

<script>
export default {
    props: ['object'],
    name: 'joinroom',
    data() {
        return {
            selectedServer:'',
            serverError: null,
            roomError: null,
            room:'',
            password:'',
            connectionPending: false,
            thisServer: window.location.origin
        }
    },
    methods: {
        attemptConnect: function(){        
            var that = this
            this.connectionPending = true
            // Attempt the connection
            if (this.selectedServer != 'custom'){
                console.log('Attempting to connect to ' + this.selectedServer )
                this.$store.dispatch('socketConnect',{
                    address:this.selectedServer,
                    callback:function(data){
                        if (!data.result){
                            that.serverError = "Failed to connect to " + that.selectedServer
                        } else {
                            that.serverError = null
                        }
                    }
                })
            } 
            return
        },
        attemptConnectCustom: function(){
            var that = this
            console.log('Attempting to connect to ' + this.CUSTOMSERVER )
            this.$store.dispatch('socketConnect',{
                address:this.CUSTOMSERVER,
                callback:function(data){
                    if (!data.result){
                        console.log('Failed to connect')
                        that.serverError = "Failed to connect to " + that.customServer
                    } else {
                        that.serverError = null
                    }
                }
            })
        },
        joinRoom: function(){
            var that = this
            console.log('Attempting to join room ' + this.room)
            if (!this.context.getters.getConnected){
                console.log('Cant join room because we arent connected to a server!')
                return
            }
            if (this.room == '' || this.room == null){
                this.roomError = 'You must enter a room name!'
                return
            }
            let temporaryObj = {
                user:this.plex.user,
                roomName:this.room.toLowerCase(),
                password:this.password,
                callback:function(result){
                    if (result){
                        that.$parent.$parent.$refs.joinroomModal.close()
                        //$('#joinRoomModal').modal('close');
                        that.selectedServer = ''
                    }
                }
            }
            this.$store.dispatch('joinRoom',temporaryObj)
        }
    },
    computed: {
        plex: function(){
            return this.$store.state.plex
        },
        context: function(){
            return this.$store
        },     
        darkModeBackground: function(){
            if (this.$store.getters.getSettingDARKMODE){
                return {
                    'background-color':'#282A2D'
                }
            }
            return {}

        },   
        CUSTOMSERVER: {
            get () {
                if (!this.$store.getters.getSettingCUSTOMSERVER){
                    return 'http://'
                }
                return this.$store.getters.getSettingCUSTOMSERVER
            },
            set (value) {
                this.$store.commit('setSettingCUSTOMSERVER',value)
            }
        },
    },    
    mounted: function() {
        // Create event listeners 
    }
}
</script>

