<template>
  <div v-if="!isPlayer" class="mdc-permanent-drawer__toolbar-spacer windowDrag" style="padding: 0">
    <div class="row" style="width: 100%">
      <div class="col s12 " style="height: 63px">
        <a class="left" style="padding-top: 5px">
          <div class="windowNoDrag dropdown-button" data-activates="dropdown1">
            <div class="left">
              <img v-if="plex" v-bind:src="plex.user.thumb" alt="" id="meAvatar"
                   class="circle ptuser-avatar plexNavAccount right" style="height: 54px; width: 54px">
            </div>
            <div class="right" style="bottom: 0">
              <i class="material-icons navDropdown right plex-shuttlegray-text"
                 style="opacity: 0.6;margin-top: 39px;margin-left: -17px;margin-right: -7px;">arrow_drop_down</i>
            </div>
          </div>
          <ul id="dropdown1" class="dropdown-content"
              style="width: 229px; top: 68px; left: 5px; position: absolute; opacity: 1; display: none; padding: 0">
            <li v-on:click="openSettings()" class="preferences"><a>Preferences</a></li>
            <li v-on:click="refreshPlexDevices()" class="preferences"><a>Refresh Plex Devices</a></li>
            <hr style="border-color: rgba(0,0,0,0.1); width: 90%">
            <li>
              <a class="navbar-brand" target="_blank" href="https://github.com/samcm/PlexTogether"> Github </a>
            </li>
            <li>
              <a class="navbar-brand" target="_blank"
                 href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=TKAR59DZ4HPWC&lc=AU&item_name=Plex%20Together&currency_code=AUD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted">
                Donate </a>
            </li>
            <li>
              <a class="navbar-brand" target="_blank" href="https://discord.gg/fKQB3yt"> Discord </a>
              <hr style="border-color: rgba(0,0,0,0.1); width: 90%">
            </li>
            <li class="divider"></li>
            <li v-if="plex != null">
              <router-link to="/signout" class="nav-item nav-link"> Sign Out </router-link>
            </li>
          </ul>
        </a>
        <ul class="nav navbar-nav center">
          <li style="padding:1%;">
            <a href="http://plextogether.com" target="_blank"><img class="hide-on-med-and-down"
                                                                   style="height: 50px; width: 54px; vertical-align: middle; margin-top: -7px"
                                                                   v-bind:src="logo"></img></a>
          </li>
          <li style="padding:1%;">
            <a class="navbar-brand" href="/"> Home </a>
          </li>
          <li v-if="firstRun" style="padding:1%;">
            <router-link to="/sync" class="nav-item nav-link"> Launch </router-link>
          </li>
          <li v-if="showLinkShortener && chosenClient">
            <v-btn style="background-color: #E5A00D" class="waves-effect waves-light btn"
                   v-on:click.native="$dialog('Copied link')" v-clipboard="shortUrl">Invite
            </v-btn>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="!darkMode">
      <sweet-modal ref="settingsModal" overlay-theme="dark" modal-theme="dark">
        <settings></settings>
      </sweet-modal>
      <sweet-modal ref="statisticsModal" overlay-theme="dark" modal-theme="dark">
        <statistics></statistics>
      </sweet-modal>
    </div>

  </div>
</template>

<script>


  import { SweetModal, SweetModalTab } from 'sweet-modal-vue'
  import settings from './application/settings'
  import statistics from './application/statistics'
  import invite from './application/invite'

  var ip = require('ip');

  export default {
    components: {
      settings,
      statistics,
      invite,
      SweetModal,
      SweetModalTab
    },
    data () {
      return {}
    },
    mounted: function () {

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
        return (this.ptConnected && this.ptServer && this.ptRoom)
      },
      shortUrl: function () {
        console.log('Short url calc done below')
        console.log(this.$store.getters.getShortLink)
        return this.$store.getters.getShortLink
      },
      firstRun: function () {
        return !this.$store.getters.getSettingHOMEINIT
      }
    },
    methods: {
      openSettings: function () {
        return this.$refs.settingsModal.open()
      },
      openStatistics: function () {
        return this.$refs.statisticsModal.open()
      },
      generateShortLink: function () {
        console.log('Generating a shortened link')
        return this.sendShortLinkRequest(false)
      },
      sendShortLinkRequest: function (overrideHost) {

      },
      refreshPlexDevices: function () {
        let oldClient = this.$store.getters.getChosenClient
        if (this.$store.getters.getSocket) {
          this.$store.getters.getSocket.disconnect()
        }
        this.$store.commit('SET_CHOSENCLIENT', null)
        this.$store.commit('REFRESH_PLEXDEVICES')
      }
    }
  }
</script>
