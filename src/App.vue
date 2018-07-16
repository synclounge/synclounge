<template>
  <v-app dark style="height:100%">
    <v-navigation-drawer app temporary v-model="drawer" disable-route-watcher>
      <leftsidebar></leftsidebar>
    </v-navigation-drawer>
    <v-navigation-drawer
      v-if="showRightDrawerButton"
      style="padding: 0; z-index: 6"
      app
      persistent
      v-model="drawerRight" right enable-resize-watcher>
      <drawerright></drawerright>
    </v-navigation-drawer>

    <v-toolbar app fixed style="z-index: 5">
      <v-toolbar-side-icon @click="drawer = !drawer"></v-toolbar-side-icon>
      <a href="https://synclounge.tv" target="_blank">
        <img class="ma-1 hidden-xs-only" style="height: 42px; width: auto; vertical-align: middle" v-bind:src="logos.light.long"/>
        <img class="ma-1 hidden-sm-and-up" style="height: 42px; width: auto; vertical-align: middle" v-bind:src="logo"/>
      </a>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn color="primary" dark raised v-if="shortUrl != null" v-clipboard="shortUrl" @success="sendNotification()">Invite</v-btn>
        <v-btn small tag="a" class="hidden-sm-and-down" flat v-for="item in links" :key="item.title" :href="item.href" :target="item.target">{{ item.title }}</v-btn>
        <v-btn small tag="a" class="hidden-sm-and-down" flat @click="donateDialog = true">Donate ♥</v-btn>
        <v-icon v-if="showRightDrawerButton" @click="toggleDrawerRight" class="clickable">{{ drawerRight ? 'last_page' : 'first_page' }}</v-icon>
      </v-toolbar-items>
    </v-toolbar>
    <v-content v-bind:style="mainStyle" app>
      <v-container class="ma-0 pa-0" align-start :style="containerStyle" style="height: 100%; z-index: 250" fluid>
        <v-flex xs12 v-if="(loading || !plex.gotDevices) && route.protected">
          <v-container fill-height>
            <v-layout justify-center align-center wrap row class="pt-4 text-xs-center">
              <v-flex xs8 md4>
                <v-progress-circular indeterminate v-bind:size="60" class="amber--text"></v-progress-circular>
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <div v-else :style="paddingStyle">
          <v-breadcrumbs v-if="crumbs && crumbs.length > 0" class="text-xs-left" style="justify-content: left">
            <v-icon slot="divider">chevron_right</v-icon>
            <v-breadcrumbs-item
              v-for="item in crumbs" :key="item.text" :to="item.to" :exact="true">
              {{ item.text }}
            </v-breadcrumbs-item>
          </v-breadcrumbs>
          <router-view></router-view>
        </div>
        <v-snackbar
          color="green darken-2"
          bottom
          :timeout="4000"
          v-model="snackbar">
          <div style="text-align:center; width:100%">{{ snackbarMsg }}</div>
        </v-snackbar>
        <upnext></upnext>
        <v-dialog v-model="donateDialog" max-width="650px">
          <donate :donateDialog="donateDialog"></donate>
        </v-dialog>
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
import donate from './donate'

let SettingsHelper = require('../SettingsHelper')
let settings = new SettingsHelper()

export default {
  components: {
    drawerright,
    upnext,
    leftsidebar,
    donate
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
      ]

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
    if (this.$route.query.autojoin) {
      this.$store.commit('SET_AUTOJOIN', true)
      this.$store.commit('SET_AUTOJOINROOM', this.$route.query.room)
      this.$store.commit('SET_AUTOJOINURL', this.$route.query.server)
      this.$store.commit('SET_VALUE', ['autoJoinOwner', this.$route.query.owner])
      if (this.$route.query.password) {
        this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.password)
      }
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
      if (this.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10' && data[1]) {
        this.$router.push('/nowplaying/' + data[2].machineIdentifier + '/' + data[1])
      }
      if (this.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10' && !data[1] && this.$route.fullPath.indexOf('/nowplaying') > -1) {
        this.$router.push('/browse/')
      }
      this.$store.dispatch('PLAYBACK_CHANGE', data)
    })
    console.log('Route path', this.$route.fullPath)
    if (!window['localStorage'].getItem('plexuser')) {
      console.log('Token doesnt exist', window['localStorage'].getItem('plexuser'))
      if (this.$route.fullPath.indexOf('join') === -1) {
        this.$router.push('/signin')
      }
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
      return this.$router.push('/signin')
    }
    if (settings.autoJoin) {
      await this.$store.dispatch('autoJoin', {
        server: settings.autoJoinServer,
        password: settings.autoJoinPassword,
        room: settings.autoJoinRoom
      })
    }

    // if (this.$store.getters.getAutoJoin) {
    //   // Attempt to auto join
    //   this.$store.dispatch('socketConnect', {
    //     address: this.$store.getters.getAutoJoinUrl,
    //     callback: function () {}
    //   })
    // }
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
          return 'Library'
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
      return this.logos.light.small
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
