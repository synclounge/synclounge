<template>
  <v-app dark style="height:100%">
    <v-navigation-drawer app temporary v-model="drawer" disable-route-watcher>
      <leftsidebar></leftsidebar>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-if="showRightDrawerButton"
      style="padding: 0"
      app      
      persistent
      v-model="drawerRight" right enable-resize-watcher>
      <drawerright></drawerright>
    </v-navigation-drawer>
    <v-toolbar app fixed>
      <v-toolbar-side-icon @click="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="white--text">SyncLounge</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>        
        <img class="ma-2" style="height:48px; width: 48px" v-bind:src="logo"/>
        <v-btn primary dark raised v-if="shortUrl != null" v-clipboard="shortUrl" @success="sendNotification()">Invite</v-btn>
        <v-btn small tag="a" class="hidden-sm-and-down" flat v-for="item in links" :key="item.title" :href="item.href" :target="item.target">{{ item.title }}</v-btn>
        <v-toolbar-side-icon v-if="showRightDrawerButton" @click="toggleDrawerRight"></v-toolbar-side-icon>
      </v-toolbar-items>
    </v-toolbar>
    <v-content v-bind:style="mainStyle">
      <v-container class="ma-0 pa-3" align-start v-bind:style="containerStyle" style="height: 100%" fluid>
        <v-flex xs12 v-if="loading || !plex.gotDevices">
          <v-container fill-height>
            <v-layout justify-center align-center wrap row class="pt-4 text-xs-center">
              <v-flex xs8 md4>				
                <v-progress-circular indeterminate v-bind:size="60" class="amber--text"></v-progress-circular>
              </v-flex>      
            </v-layout>
          </v-container>
        </v-flex>
        <div v-else>      
          <v-breadcrumbs class="text-xs-left" style="justify-content: left">
          <v-icon slot="divider">chevron_right</v-icon>
            <v-breadcrumbs-item 
              v-for="item in crumbs" :key="item.text" :to="item.to" :exact="true"
            >
              {{ item.text }}
            </v-breadcrumbs-item>
					</v-breadcrumbs>       
          <router-view ></router-view>   
        </div> 
        <v-snackbar
          bottom
          :timeout="4000"
          v-model="snackbar"
        > <div style="text-align:center; width:100%">{{ snackbarMsg }}</div>
        </v-snackbar>
      </v-container>
    </v-content> 
  </v-app>
</template>

<script>
  // Custom css
  import './assets/css/style.css'

  import drawerright from './sidebar'
  import leftsidebar from './leftsidebar'


  export default {
    components: {
      drawerright,
      leftsidebar
    },
    data () {
      return {        
        drawer: false,
        mini: false,
        drawerRight: false,
        right: null,
        fixed: false,  
        initialized: false, 
        
        loading: true,

        snackbar: false,  
        snackbarMsg: false,

        items: [
          {
            title: 'Preferences'
          },
          {
            title: 'Signout'
          }
        ],
        links: [          
          {
            title: 'Github',
            href: 'https://github.com/samcm/SyncLounge',
            target: '_blank'
          },
          {
            title: 'Discord',
            target: '_blank',
            href: 'https://discord.gg/fKQB3yt'
          },
          {
            title: 'Donate ♥',
            target: '_blank',
            href: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=TKAR59DZ4HPWC&lc=AU&item_name=Plex%20Together&currency_code=AUD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted'
          },
        ]
      }
    },
    methods: {      
      sendNotification() {
        window.EventBus.$emit('notification', 'Copied to clipboard')
      },
      toggleDrawerRight() {
        console.log('Opening right drawer', !this.drawerRight)
        this.drawerRight = !this.drawerRight
      }
    },
    mounted: async function () {
      // Verify route changes 
      
      if (this.$route.query.ptserver && this.$route.query.ptroom) {
        console.log('We should auto join')
        // Looks like a valid request...
        // Lets setup an auto join and then move the user to /sync
        this.$store.commit('SET_AUTOJOIN', true)
        this.$store.commit('SET_AUTOJOINROOM', this.$route.query.ptroom)
        this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.ptpassword)
        this.$store.commit('SET_AUTOJOINURL', this.$route.query.ptserver)
      }      
      window.EventBus.$on('notification', (msg) => {
        this.snackbarMsg = msg
        this.snackbar = true
      })
      if (window['localStorage'].getItem('plexuser') == null) {
        console.log('User isnt signed in  - sending to signin')
        this.$router.push('/signin')
        this.loading = false
        return
      }
      if (this.$route.path === '/') {
        this.$router.push('/clientselect')
      }
      console.log('Logging in to Plex.Tv')
      let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))
      await this.$store.dispatch('PLEX_LOGIN_TOKEN', plexstorage.authToken)
      this.loading = false

    },
    watch: {
      showRightDrawerButton: function () { 
        if (this.showRightDrawerButton){
          this.drawerRight = true
        }
      }
    },
    computed: {
      plex: function () {
        return this.$store.getters.getPlex
      },
      itemCache: function () {
        return this.$store.getters.getItemCache
      },	
      crumbs: function () {
        if (this.$route.path.indexOf('browse') === -1) {
          return []
        }
        const getTitle = (id) => {
          try {
            return this.itemCache[this.$route.params.machineIdentifier][id].title
          } catch (e) {
            return 'Loading..'
          }
        }
				let data = [{
          text: 'Home',
          to: '/browse'
        }]
				let map = {
					machineIdentifier: () => {
						return {
							text: this.plex.servers[this.$route.params.machineIdentifier].name,
							to: '/browse/' + this.$route.params.machineIdentifier
						}
          },					
          sectionId: () => {
						return {
							text: this.$route.params.sectionId,
							to: '/browse/' + this.$route.params.machineIdentifier + '/' + this.$route.params.sectionId
						}
          },          
          parentKey: () => {
            let to
            if (this.$route.params.grandparentKey) {
              to = '/browse/' + this.$route.params.machineIdentifier + '/' + this.$route.params.sectionId 
              + '/tv/' + this.$route.params.grandparentKey + '/' + this.$route.params.parentKey
            } else {
              '/browse/' + this.$route.params.machineIdentifier + '/' + this.$route.params.sectionId 
              + '/tv/' + this.$route.params.parentKey
            }
						return {
							text: getTitle(this.$route.params.parentKey),
              to: to
						}
          },          
          grandparentKey: () => {
						return {
							text: getTitle(this.$route.params.grandparentKey),
              to: '/browse/' + this.$route.params.machineIdentifier + '/' + this.$route.params.sectionId 
              + '/tv/' + this.$route.params.grandparentKey + '/'
						}
					},
					ratingKey: () => {
						return {
							text: getTitle(this.$route.params.ratingKey),
              to: '/browse/' + this.$route.params.machineIdentifier +
                  '/' + this.$route.params.sectionId + '/' + this.$route.params.ratingKey
						}
					}
        }
        for (let param in this.$route.params) {
          data.push(map[param]())
        }
				// this.$route.params.forEach((route) => {
        //   console.log(route)
				// 	// if (!route || route.path === '') return 
					
				// })
				return data
			},
      showRightDrawerButton: function () {
        return (this.ptConnected && this.chosenClient && this.ptRoom)
      },
      chosenClient: function () {
        return this.$store.getters.getChosenClient
      },
      plexusername: function () {
        return this.$store.state.plex.user.username
      },
      plexthumb: function () {
        return this.$store.state.plex.user.thumb
      },
      logo: function () {
        return 'ptweb/logo-small-light.png'
      },    
      isPlayer: function () {
        if (this.$route.path == '/') {
          return true
        }
        return false
      },	  
      validDevices: function() {
        if (!this.plex) {
          return false
        }
        return this.plex.gotDevices
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
      showLinkShortener: function () {
        return (this.ptConnected && this.ptServer && this.ptRoom && this.shortUrl)
      },
      shortUrl: function () {
        console.log(this.$store.getters.getShortLink)
        return this.$store.getters.getShortLink
      },
      firstRun: function () {
        return !this.$store.getters.getSettingHOMEINIT
      },

      mainStyle: function() {
        if (this.$store.getters.getBackground != null){
          return {
            'background-image': 'url('+this.$store.getters.getBackground+')',
            'background-repeat': 'no-repeat',
            'background-size': 'cover',
            'background-position': 'center'
          }
        }
      },      
      containerStyle: function() {
        if (this.$store.getters.getBackground != null){
          return {
            background: 'rgba(0,0,0,0.7)'
          }
        }
      }
    },
  }
</script>

<style>
  .a {
    color: white; 
    text-decoration: none !important;
  }
  a:-webkit-any-link {
    color: unset !important; 
    text-decoration: none !important;
  }
</style>


<style lang="stylus">
  @import './stylus/main'
</style>
