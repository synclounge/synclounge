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
    <v-dialog v-model="donateDialog" max-width="650px">
      <v-card class="grey darken-4">
        <v-card-title class="title">
          Donate
          <v-spacer></v-spacer>
          <img :src="logos.light.small" style="height: 50px"/>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <p class="pa-2"> All donations to SyncLounge go directly towards running the SyncLounge public servers and the continued development of the application. </p>
          <v-subheader> How to donate </v-subheader>
          <v-layout row justify-center align-center class="pa-0 ma-1">
              <v-flex xs4 class="text-xs-center">
                <v-btn block color="primary" class="white--text" target="_blank" href="https://www.paypal.com/donate/?token=6DxQYVqxfpwVBp95l6ZcS1-HqEO7V4b1rG_lFcqgwQvjQjI2aGDcyEs5VEcfZAce95Hbsm&country.x=AU&locale.x=AU">
                  Paypal
                </v-btn>
              </v-flex>
            </v-layout>
          <div class="text-xs-center pa-2">
            <v-layout row justify-center align-center v-for="(address, coin) in addresses" :key="coin" class="pa-0 ma-1">
              <v-flex xs2 style="font-weight: 600">
                {{ coin }}
              </v-flex>
              <v-flex xs8>
                {{ address }}
              </v-flex>
              <v-flex xs2 class="text-xs-center">
                <v-icon v-clipboard="address" v-on:click.native="sendNotification()" class="mr-2 primary--text click-cursor">content_copy</v-icon>
              </v-flex>
            </v-layout>
          </div>
          <v-divider></v-divider>
          <p class="pa-2 soft-text mb-0 pb-0" >If you make a donation, stop by the Discord and message samcm#2715 to get your Donator role. Thankyou!</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" flat @click.stop="donateDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-toolbar app fixed>
      <v-toolbar-side-icon @click="drawer = !drawer"></v-toolbar-side-icon>
      <router-link :to="'/browse'">
        <v-toolbar-title class="white--text"> SyncLounge </v-toolbar-title>
      </router-link>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <img class="ma-2" style="height:48px; width: 48px" v-bind:src="logo"/>
        <v-btn color="primary" dark raised v-if="shortUrl != null" v-clipboard="shortUrl" @success="sendNotification()">Invite</v-btn>
        <v-btn small tag="a" class="hidden-sm-and-down" flat v-for="item in links" :key="item.title" :href="item.href" :target="item.target">{{ item.title }}</v-btn>
        <v-btn small tag="a" class="hidden-sm-and-down" flat @click="donateDialog = true">Donate ♥</v-btn>
        <v-toolbar-side-icon v-if="showRightDrawerButton" @click="toggleDrawerRight"></v-toolbar-side-icon>
      </v-toolbar-items>
    </v-toolbar>
    <v-content v-bind:style="mainStyle">
      <v-container class="ma-0 pa-0" align-start :style="containerStyle" style="height: 100%" fluid>
        <v-flex xs12 v-if="(loading || !plex.gotDevices)">
          <v-container fill-height>
            <v-layout justify-center align-center wrap row class="pt-4 text-xs-center">
              <v-flex xs8 md4>
                <v-progress-circular indeterminate v-bind:size="60" class="amber--text"></v-progress-circular>
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <div v-else :style="paddingStyle" style="overflow: scroll">
          <v-breadcrumbs v-if="crumbs && crumbs.length > 0" class="text-xs-left" style="justify-content: left">
            <v-icon slot="divider">chevron_right</v-icon>
            <v-breadcrumbs-item
              v-for="item in crumbs" :key="item.text" :to="item.to" :exact="true">
              {{ item.text }}
            </v-breadcrumbs-item>
          </v-breadcrumbs>
          <router-view></router-view>
          <upnext v-if="showUpNext"></upnext>
        </div>
        <v-snackbar
          color="green darken-2"
          bottom
          :timeout="4000"
          v-model="snackbar">
          <div style="text-align:center; width:100%">{{ snackbarMsg }}</div>
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
import upnext from './upnext'

export default {
  components: {
    drawerright,
    upnext,
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

      donateDialog: false,

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
        }
      ],
      addresses: {
        ETH: '0xC886a3b94867AC12901220BBcbFD407e60E009A5',
        LTC: 'LQkfMbcFGQgMZWw13hbzbYkRkSM6n1fZjE',
        BTC: '3Q7wZnUdJMQi53eH3dErms9Tno7VGmTHZL',
        BCH: '1K3ULWzW9dLyGbtpnNqUysHuj1suZFXtx4'
      }
    }
  },
  methods: {
    sendNotification () {
      window.EventBus.$emit('notification', 'Copied to clipboard')
    },
    toggleDrawerRight () {
      this.drawerRight = !this.drawerRight
    }
  },
  mounted: async function () {
    // Verify route changes
    try {
      if (window.chrome) {
        window.chrome.runtime.sendMessage(
          'mlmjjfdcbemagmnjahllphjnohbmhcnf',
          { command: 'heartbeat' },
          response => {
            if (response) {
              this.$store.commit('SET_EXTAVAILABLE', true)
              window.localStorage.setItem('EXTAVAILABLE', true)
            }
          }
        )
      }
    } catch (e) {
      // Browser is not Chrome
      window.localStorage.setItem('EXTAVAILABLE', false)
    }

    if (this.$store.getters.getAutoJoin) {
      // Attempt to auto join
      this.$store.dispatch('socketConnect', {
        address: this.$store.getters.getAutoJoinUrl,
        callback: function () {}
      })
    }

    if (this.$route.query.ptserver && this.$route.query.ptroom) {
      // Looks like a valid request...
      // Lets setup an auto join and then move the user to /sync
      this.$store.commit('SET_AUTOJOIN', true)
      this.$store.commit('SET_AUTOJOINROOM', this.$route.query.ptroom)
      this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.ptpassword)
      this.$store.commit('SET_AUTOJOINURL', this.$route.query.ptserver)
    }
    window.EventBus.$on('notification', msg => {
      this.snackbarMsg = msg
      this.snackbar = true
    })
    window.EventBus.$on('NEW_TIMELINE', timeline => {
      this.$store.dispatch('NEW_TIMELINE', timeline)
    })
    window.EventBus.$on('PLAYBACK_CHANGE', data => {
      console.log('Playback change event', data)
      this.$store.dispatch('PLAYBACK_CHANGE', data)
    })
    if (!window['localStorage'].getItem('plexuser')) {
      console.log('Token doesnt exist', window['localStorage'].getItem('plexuser'))
      this.$router.push('/signin')
      this.loading = false
      return
    }
    if (this.$route.path === '/') {
      this.$router.push('/clientselect')
    }
    let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))
    try {
      await this.$store.dispatch('PLEX_LOGIN_TOKEN', plexstorage.authToken)
    } catch (e) {
      console.log('Login failed', e)
      this.$router.push('/signin')
    }
    this.loading = false
  },
  watch: {
    showRightDrawerButton: function () {
      if (this.showRightDrawerButton) {
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
    libraryCache: function () {
      return this.$store.getters.getLibraryCache
    },
    showUpNext: function () {
      let ratingKey
      if (!this.chosenClient || !this.chosenClient.lastTimelineObject) {
        return false
      }
      ratingKey = this.chosenClient.lastTimelineObject.ratingKey
      if (ratingKey === this.override) {
        return false
      }
      let cache = this.$store.state.upNextCache
      let machineIdentifier = this.chosenClient.lastTimelineObject.machineIdentifier
      if (!cache[machineIdentifier]) {
        return false
      }
      if (!cache[machineIdentifier][ratingKey]) {
        return false
      }
      if (cache[machineIdentifier][ratingKey].loading) {
        return false
      }
      return true
    },
    extAvailable: function () {
      return this.$store.getters.getExtAvailable
    },
    crumbs: function () {
      if (this.$route.path.indexOf('browse') === -1) {
        return []
      }
      const getTitle = id => {
        try {
          return this.itemCache[this.$route.params.machineIdentifier][id].title
        } catch (e) {
          console.log(id, e)
          return 'Loading..'
        }
      }
      const getLibrary = id => {
        try {
          return this.libraryCache[this.$route.params.machineIdentifier][id]
        } catch (e) {
          return 'Loading..'
        }
      }
      let data = [
        {
          text: 'Home',
          to: '/browse'
        }
      ]
      let map = {
        machineIdentifier: () => {
          return {
            text: this.plex.servers[this.$route.params.machineIdentifier].name,
            to: '/browse/' + this.$route.params.machineIdentifier
          }
        },
        sectionId: () => {
          return {
            text: getLibrary(this.$route.params.sectionId),
            to:
              '/browse/' +
              this.$route.params.machineIdentifier +
              '/' +
              this.$route.params.sectionId
          }
        },
        parentKey: () => {
          let to
          if (this.$route.params.grandparentKey) {
            to =
              '/browse/' +
              this.$route.params.machineIdentifier +
              '/' +
              this.$route.params.sectionId +
              '/tv/' +
              this.$route.params.grandparentKey +
              '/' +
              this.$route.params.parentKey
          } else {
            to =
              '/browse/' +
              this.$route.params.machineIdentifier +
              '/' +
              this.$route.params.sectionId +
              '/tv/' +
              this.$route.params.parentKey
          }
          return {
            text: getTitle(this.$route.params.parentKey),
            to: to
          }
        },
        grandparentKey: () => {
          return {
            text: getTitle(this.$route.params.grandparentKey),
            to:
              '/browse/' +
              this.$route.params.machineIdentifier +
              '/' +
              this.$route.params.sectionId +
              '/tv/' +
              this.$route.params.grandparentKey +
              '/'
          }
        },
        ratingKey: () => {
          return {
            text: getTitle(this.$route.params.ratingKey),
            to:
              '/browse/' +
              this.$route.params.machineIdentifier +
              '/' +
              this.$route.params.sectionId +
              '/' +
              this.$route.params.ratingKey
          }
        }
      }
      for (let param in this.$route.params) {
        let link = map[param]()
        if (link) {
          data.push(link)
        }
      }
      // this.$route.params.forEach((route) => {
      //   console.log(route)
      // if (!route || route.path === '') return

      // })
      return data
    },
    showRightDrawerButton: function () {
      return this.ptConnected && this.chosenClient && this.ptRoom
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
      return 'slweb/logo-small-light.png'
    },
    isPlayer: function () {
      if (this.$route.path === '/') {
        return true
      }
      return false
    },
    validDevices: function () {
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
      return this.ptConnected && this.ptServer && this.ptRoom && this.shortUrl
    },
    shortUrl: function () {
      return this.$store.getters.getShortLink
    },
    firstRun: function () {
      return !this.$store.getters.getSettingHOMEINIT
    },

    mainStyle: function () {
      if (this.$store.getters.getBackground != null) {
        return {
          'background-image': 'url(' + this.$store.getters.getBackground + ')',
          'background-repeat': 'no-repeat',
          'background-size': 'cover',
          'background-position': 'center'
        }
      }
    },
    containerStyle: function () {
      let arr = []
      if (this.$store.getters.getBackground !== null) {
        arr.push({
          background: 'rgba(0,0,0,0.7)'
        })
      }
      return arr
    },
    paddingStyle: function () {
      let arr = []
      if (this.$route.path.indexOf('/player') === -1) {
        arr.push({
          padding: '16px'
        })
      }
      return arr
    }
  }
}
</script>

<style>
.a {
  color: unset !important;
  text-decoration: none !important;
}
</style>

<style lang="stylus">
@import './stylus/main';
</style>
