<template>
    <div>  
        <v-list class="pa-1" dense>
          <template>           
            <v-list-tile v-if="plex && plex.user">
              <v-list-tile-avatar>
                 <img class="pa-1" :src="plex.user.thumb" />
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title style="font-weight: bold">{{ plex.user.username }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider></v-divider>
            <v-subheader>Preferences</v-subheader>
            <v-list-tile @click.stop="ptsettingstoggle = !ptsettingstoggle">
              <v-list-tile-action>
                <v-icon color="white">settings</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>PlexTogether Settings</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile v-if="plex && plex.gotDevices" @click.stop="plexsettingstoggle = !plexsettingstoggle">
              <v-list-tile-action>
                <v-icon color="white">settings</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Plex Settings</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-subheader v-if="plex && plex.gotDevices" >Account</v-subheader>       
            <v-list-tile :router="true" to="/signout">
              <v-list-tile-action>
                <v-icon color="white">cancel</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Sign out</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-subheader >About</v-subheader>
            <v-list-tile>
              <v-list-tile-action>
                <v-icon color="white">info</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>PlexTogether v{{appVersion}}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </v-list>

      <v-dialog v-model="ptsettingstoggle">
        <v-card class="grey darken-4 pa-3">        
          <h6 class="soft-text">PlexTogether Settings</h6>
          <v-divider></v-divider>
          <ptsettings></ptsettings>
        </v-card>
      </v-dialog>
      <v-dialog  v-model="plexsettingstoggle">
        <v-card class="grey darken-4 pa-3">        
          <h6 class="soft-text">Plex Settings</h6>
          <v-divider></v-divider>
          <plexsettings v-if="validPlex && plex.gotDevices"></plexsettings>
        </v-card>
      </v-dialog>
		</div>		
</template>

<script>
  import ptsettings from './components/application/settings'  
  import plexsettings from './components/application/plexsettings'
  export default {
		components: {
      ptsettings,
      plexsettings
		},
    data () {
      return {
        ptsettingstoggle: false,
        plexsettingstoggle: false
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
      appVersion: function() {
        return this.$store.state.appVersion
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
    },
		methods: {
			isHost: function (user) {
        if (user.role == 'host') {
          return true
        }
        return false
      },
      percent: function (user) {
        let perc = (parseInt(user.time) / parseInt(user.maxTime)) * 100
        if (isNaN(perc)) {
          perc = 0
        }
        return perc
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
            return 'pause'
          }
          if (user.playerState == 'paused') {
            return 'pause'
          }
          if (user.playerState == 'playing') {
            return 'play_arrow'
          }
        }
        return false
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