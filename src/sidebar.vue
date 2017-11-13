<template>
		<v-container class="pa-1 pb-0" fill-height>
			<v-layout>
				<v-flex xs12>
					<v-layout v-if="ptRoom" column>   
						<v-flex xs12 style="height: 50vh">
							<h6 style="text-align:center" class="mb-0 pb-0 pt-3"> Room {{ ptRoom }}</h6>
							<v-subheader>Users ({{ ptUsers.length }})</v-subheader>  
							<v-list dense style="overflow-y:scroll">
								<div v-for="user in ptUsers" v-bind:key="user.username" style="position:relative;height:7em">
										<v-list-tile avatar style="height:4em" class="pb-0 mb-0" tag="div" >
											<v-list-tile-avatar>
												<img v-bind:src="user.avatarUrl" v-on:dblclick="transferHost(user.username)"/>
											</v-list-tile-avatar>
											<v-list-tile-content>
												<v-list-tile-title> {{ user.username }}</v-list-tile-title>
												<v-list-tile-sub-title style="opacity:0.6;color:white;font-size:70%"><v-icon style="font-size:90%">{{playerState(user)}}</v-icon> - {{getTitle(user)}}</v-list-tile-sub-title>
											</v-list-tile-content>   
											<v-list-tile-action  v-if="isHost(user)">     
												<v-icon v-if="isHost(user)" style="color: #E5A00D">star</v-icon>
											</v-list-tile-action>		
										</v-list-tile>
									<div class="pl-2 pr-2 pt-2 mt-0 pb-0 mb-0">
										<span style="float: left;font-size:70%" class="ptuser-time pl-2">{{ getCurrent(user) }}</span>
										<span style="float: right;font-size:70%" class="ptuser-maxTime pr-2">{{ getMax(user) }}</span>
										<v-progress-linear class="pt-content-progress " :height="2" :value="percent(user)"></v-progress-linear>
									</div>
									<v-divider class="mt-0 pt-0" style="height:2px; color:white"></v-divider>  
								</div>
							</v-list>
						</v-flex>
						<v-flex xs12 style="height: 50vh max-height: 50vh; position: relative">
							<v-container class="ma-0 pa-0">
								<v-layout row wrap>
									<v-flex xs12>
										<v-divider></v-divider>  
										<v-subheader>Messages</v-subheader>  
										<v-list id="chatbox" :style="chatboxStyle" style="overflow-y:scroll; max-height: 35vh; height: 35vh">
												<v-list-tile  style="min-height:50px; height:initial; position:relative" v-bind:id="getMsgId(msg)" v-for="msg in messages" v-bind:key="msg.msg + msg.time" tag="div">
													<v-list-tile-avatar>
														<img v-bind:src="msg.user.thumb || msg.user.avatarUrl" style="position:absolute;top:0; width: 36px; height: 36px"/>
													</v-list-tile-avatar>
													<v-list-tile-content>
														<v-list-tile-title style="color:white; position:relative;">
															<span style="opacity:1;font-size:80%; float:left"> {{ msg.user.username }}</span>
															<span style="opacity:0.6;font-size:60%; float:right"> {{ msg.time}}</span>
														</v-list-tile-title>
														<v-list-tile-sub-title style="opacity:0.8;color:white;font-size:70%;"> {{ msg.msg }}</v-list-tile-sub-title>
													</v-list-tile-content>
												</v-list-tile>
										</v-list>
									</v-flex>									
									<v-flex xs12 style="position:relative" class="pt-2">
										<div style="bottom:0; width: 100%" class="ma-0 pa-0">
											<v-text-field
												prepend-icon="message"					
												:label="'Send a message to ' + '#'+ptRoom"
												autoGrow
												v-on:keyup.enter.native="sendMessage()"
												v-model="messageToBeSent"
												
											></v-text-field>
										</div>
									</v-flex>
									<v-flex xs12 class="pt-2">
										<div style="position: absolute; bottom:0; width: 100%" class="ma-0 pa-0">
											<v-btn  block v-on:click.native="handleDisconnect()" class="ma-0 mt-1" primary>Leave room </v-btn>
										</div>
									</v-flex>
								</v-layout>
							</v-container>
						</v-flex>			
					</v-layout>		
				</v-flex>
			</v-layout>
		</v-container>
</template>

<script>
	import ptuser from './components/application/ptuser.vue'
  export default {
		components: {
			ptuser
		},
    data () {
      return {
				messageToBeSent: ''
      }
    },
		watch: {
			messages: function () {	
				this.$nextTick(() => {
					var options = {
						container: '#chatbox',
						easing: 'ease-in',
						cancelable: true,
					}
					this.$scrollTo('#lastMessage', 200, options)
				})
			}
		},
    computed: {
      plex: function () {
				return this.$store.getters.getPlex
			},
			chosenClient: function () {
				return this.$store.getters.getChosenClient
			},
			validPlex: function () {
			if (!this.$store.state.plex) {
				return false
			}
			return true
			},
			validDevices: function () {
			if (!this.plex) {
				return false
			}
				return this.plex.gotDevices
			},
			showBrowser () {
				return (this.chosenClient && !this.chosenClient.clientPlayingMetadata && this.ptRoom)
			},
			isPTPlayer () {
				return (this.chosenClient && this.chosenClient.clientIdentifier == 'PTPLAYER9PLUS10')
			},
			showMetadata () {
				return (!this.isPTPlayer && !this.showBrowser && this.chosenClient && this.chosenClient.clientPlayingMetadata)
			},
			darkMode: function () {
				return this.$store.getters.getSettingDARKMODE
			},
			ptConnected: function () {
				return this.$store.getters.getConnected
			},
			ptServer: function () {
				return this.$store.getters.getServer
			},
			ptRoom: function () {
				return this.$store.getters.getRoom
			},
			ptPassword: function () {
				return this.$store.getters.getPassword
			},
			ptUsers: function () {
				return this.$store.getters.getUsers
			},
			userCount: function () {
			let count = this.$store.getters.getUsers.length
				if (count == 1) {
					return count + ' user'
				}
				return count + ' users'
			},
			chatBoxMessage: function () {
				return "Message " + this.$store.getters.getRoom
			},
			playercount: function () {
				if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
					return '(' + this.$store.state.plex.clients.length + ')'
				}
				return ''
			},
			servercount: function () {
				if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
					return '(' + this.$store.state.plex.servers.length + ')'
				}
				return ''
			},
			showChatValue: function () {
				if (this.$store.getters.getShownChat) {
					return 'block'
				}
				return 'none'
			},
			messages: function () {			
				return this.$store.getters.getMessages
			},
			chatboxStyle: function(){
			}
    },
		methods: {
			isHost: function (user) {
        if (user.role == 'host') {
          return true
        }
        return false
      },
			transferHost: function (username) {
				window.x = {
					username: username,
					this: this
				}
				console.log("transfering host", window.x)
				this.$store.dispatch('transferHost', username)
			},		
      handleDisconnect: function () {
        this.$store.dispatch('disconnectServer')
      },
      percent: function (user) {
        let perc = (parseInt(user.time) / parseInt(user.maxTime)) * 100
        if (isNaN(perc)) {
          perc = 0
        }
        return perc
      },
			getMsgId (msg){				
				if (this.messages && (msg == this.messages[this.messages.length - 1])){
					return 'lastMessage'
				}
			},
      getCurrent: function (user) {
        if (isNaN(user.time)) {
						return this.getTimeFromMs(0)
        }
        return this.getTimeFromMs(user.time)
      },
      getMax: function (user) {
        if (isNaN(user.maxTime)) {
          return this.getTimeFromMs(0)
        }
        return this.getTimeFromMs(user.maxTime)
      },
      getTitle: function (user) {
        if (user.title && user.title.length > 0) {
          return user.title
        }
        return 'Nothing'
      },
	  	sendMessage: function () {
				console.log('We should send this message: ' + this.messageToBeSent)
				this.$store.dispatch('sendNewMessage', this.messageToBeSent)
				this.messageToBeSent = ''
			},
      playerState: function (user) {
        if (user.playerState) {
          if (user.playerState == 'stopped') {
            return 'stop'
          }
          if (user.playerState == 'paused') {
            return 'pause'
          }
          if (user.playerState == 'playing') {
            return 'play_arrow'
          }
        }
        return 'stop'
      },
			getTimeFromMs (ms) {
        var hours = ms / (1000 * 60 * 60)
        var absoluteHours = Math.floor(hours)
        var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours
        var minutes = (hours - absoluteHours) * 60
        var absoluteMinutes = Math.floor(minutes)
        var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes
        var seconds = (minutes - absoluteMinutes) * 60
        var absoluteSeconds = Math.floor(seconds)
        var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds
        return (h + ':' + m + ':' + s)
      }
		}
  }
</script>