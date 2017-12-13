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
    <main v-bind:style="mainStyle">
      <v-content v-bind:style="containerStyle" >
        <v-container class="ma-0 pa-0" style="max-width: unset">
          <router-view></router-view>    
          <v-snackbar
            bottom
            :timeout="4000"
            v-model="snackbar"
          > <div style="text-align:center;width:100%">{{ snackbarMsg }}</div>
          </v-snackbar>
        </v-container>
      </v-content>
    </main>    
  </v-app>
</template>

<script>
  // Custom css
  import './assets/css/styleNew.css'

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
    mounted () {
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
    },
    watch: {
      showRightDrawerButton: function () { 
        console.log('Drawer changed')
        if (this.showRightDrawerButton){
          this.drawerRight = true
        }
      }
    },
    computed: {
      plex: function () {
        return this.$store.getters.getPlex
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
        console.log('Router path is ' + this.$route.path)
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

<style lang="stylus">
  @import './stylus/main'
</style>
