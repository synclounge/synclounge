<template>
  <v-app dark>
    <v-navigation-drawer temporary v-model="drawer" :mini-variant.sync="mini" dark >
      <v-list class="pa-0">
        <v-list-item>
          <v-list-tile avatar tag="div" v-if="validDevices">
            <v-list-tile-avatar>
              <img :src="plex.user.thumb" />
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{plex.user.username}}</v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon dark @click.native.stop="mini = !mini">
                <v-icon>chevron_left</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </v-list-item>
      </v-list>
      <v-list class="pt-0" dense>
        <v-divider></v-divider>
        <v-list-item v-for="item in items" :key="item">
          <v-list-tile>
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-navigation-drawer persistent v-model="drawerRight" light right light enable-resize-watcher>
      <drawerright></drawerright>
    </v-navigation-drawer>
    <v-toolbar light>
      <v-toolbar-side-icon light @click.native.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="white--text"></v-toolbar-title>
      <v-toolbar-items>
        <v-menu class="hidden-sm-and-up" offset-y origin="bottom" left transition="v-slide-y-transition">
          <v-btn icon light slot="activator">
            <v-icon>more_vert</v-icon>
          </v-btn>
          <v-list>
            <v-list-item v-for="item in items" :key="item">
              <v-list-tile>
                <v-list-tile-title v-text="item.title"></v-list-tile-title>
              </v-list-tile>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-toolbar-item class="hidden-sm-and-down">
          <img style="height:70%;width:auto" v-bind:src="logo"/>
        </v-toolbar-item>
        <v-toolbar-item class="hidden-sm-and-down" v-for="link in links" :key="link" :href="link.href" :target="link.target">{{ link.title }}</v-toolbar-item>    
        <v-toolbar-side-icon light @click.native.stop="drawerRight = !drawerRight"></v-toolbar-side-icon>
      </v-toolbar-items>
    </v-toolbar>
    <main v-bind:style="mainStyle">
      <v-container v-bind:style="containerStyle"  fluid>
        <router-view></router-view>
      </v-container>
    </main>    
  </v-app>
</template>

<script>

  // Custom css
  import './assets/css/styleNew.css'

  import drawerright from './sidebar'


  export default {
    components: {
      drawerright
    },
    data () {
      return {        
        drawer: false,
        mini: false,
        drawerRight: false,
        right: null,
        fixed: false,        
        items: [
          {
            title: 'Preferences'
          },
          {
            title: 'Refresh Plex Devices'
          },
          {
            title: 'Signout'
          }
        ],
        links: [          
          {
            title: 'Github',
            href: 'https://github.com/samcm/PlexTogether',
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
    mounted () {
      console.log('route', this.$route)
      if (this.$route.query.ptserver && this.$route.query.ptroom) {
        console.log('We should auto join')
        // Looks like a valid request...
        // Lets setup an auto join and then move the user to /sync
        this.$store.commit('SET_AUTOJOIN', true)
        this.$store.commit('SET_AUTOJOINROOM', this.$route.query.ptroom)
        this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.ptpassword)
        this.$store.commit('SET_AUTOJOINURL', this.$route.query.ptserver)
      }
    },
    computed: {
      plex: function () {
        return this.$store.getters.getPlex
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
        return 'static/logo-small-light.png'
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
        console.log('Short url calc done below')
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
