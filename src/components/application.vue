<template>
	<div>
		<div style="margin-bottom: 0">
			<div style="margin-bottom: 0">
				<!-- MAIN CONTENT -->
				<div v-if="!validDevices" style="position: absolute; top: 50%; left: 50%">
						<v-progress-circular indeterminate v-bind:size="50" class="amber--text"></v-progress-circular>
				</div>
				<div v-if="validDevices">
					<div v-if="!ptConnected || !chosenClient || !ptRoom">
						<walkthrough></walkthrough>
					</div>
					<div v-else>
						<plexbrowser v-if="showBrowser"></plexbrowser>
						<ptplayer v-if="isPTPlayer"></ptplayer>
						<nowplaying v-if="showMetadata"></nowplaying>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
  // CSS imports
  //import 'assets/css/material-components-web.css';
  //import 'assets/css/grid.css';
  //import 'assets/css/style2.css';

  // JS imports
  import _Plex from '../assets/js/plex/PlexTv.js';

  var Plex = new _Plex()
  let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))

  // Components
  import plexclient from './application/plexclient'
  import plexserver from './application/plexserver'
  import ptuser from './application/ptuser'
  import joinroom from './application/joinroom'
  import chatmessage from './application/chatmessage'
  import walkthrough from './application/walkthrough'
  import sidebar from './application/sidebar'
  import ptplayer from './application/ptplayer'
  import plexbrowser from './application/plexbrowser'
  import nowplaying from './application/nowplaying'

  export default {
	name: 'application',
	components: {
	  plexclient,
	  plexserver,
	  joinroom,
	  sidebar,
	  ptuser,
	  chatmessage,
	  walkthrough,
	  ptplayer,
	  plexbrowser,
	  nowplaying
	},
	mounted: function () {
	  if (window['localStorage'].getItem('plexuser') == null) {
		console.log('User isnt signed in  - sending to signin')
		this.$router.push('/signin')
		return
	  }
	  var that = this
	  console.log('Logging in to Plex.Tv')
	  let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))
	  Plex.doTokenLogin(plexstorage.authToken, function (result, response, body) {
		if (result) {
		  console.log('Logged in.')
		  Plex.getDevices(function () {

			that.$store.commit('SET_PLEX', Plex)

			if (that.$store.getters.getAutoJoin) {
			  that.$store.dispatch('autoJoin')
			  that.$store.commit('SET_AUTOJOIN', false)
			}

		  })
		} else {
		  console.log('Signin failed')
		  window['localStorage'].removeItem('plexuser')
		  that.$store.state.plex = null
		  that.$store.state.signedin = 'notsignedin'
		  that.$router.push('/signin')

		}
	  })

	  if (this.$store.getters.getAutoJoin) {
		// Attempt to auto join
		console.log('Attempting to auto join ' + that.$store.getters.getAutoJoinUrl)
		that.$store.dispatch('socketConnect', {
		  address: that.$store.getters.getAutoJoinUrl,
		  callback: function (data) {

		  }
		})
	  }

	},
	created: function () {
	},
	data () {
	  return {
		clientpollers: [],
		showToggleChat: false,
		messageToBeSent: ''
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
	  step1Complete: function () {
		if (this.chosenClient) {
		  return '0.2'
		}
		return '1'
	  },
	  upToStep2: function () {
		if (this.chosenClient) {
		  return '1'
		}
		return '0.2'
	  },
	  stateTESTING: function () {
		return this.$store
	  },

	},
	methods: {
	  openJoinRoomModal: function () {
		//console.log('trying to open')
		return this.$refs.joinroomModal.open()
		//$('#joinRoomModal').modal('open');
	  },
	  joinRoomModalClosed: function () {
		if (!this.ptRoom) {
		  this.$store.dispatch('disconnectServer')
		}
	  },
	  showChat: function () {
		this.showToggleChat = !this.showToggleChat
		console.log('toggleChat')
	  },
	  sendMessage: function () {
		console.log('We should send this message: ' + this.messageToBeSent)
		this.$store.dispatch('sendNewMessage', this.messageToBeSent)
		this.messageToBeSent = ''
	  }
	},
	beforeDestroy: function () {
	  console.log('About to destroy')
	  if (this.$store.getters.getSocket) {
		this.$store.getters.getSocket.disconnect()
	  }
	}

  }
</script>

