<template>
  <v-toolbar class="black">
    <v-toolbar-side-icon light>
    </v-toolbar-side-icon>      
    <v-toolbar-title class="white--text"></v-toolbar-title>
    <v-toolbar-items>
      <v-menu class="hidden-sm-and-up" offset-y origin="bottom" left transition="v-slide-y-transition">
        <v-btn icon light slot="activator">
          <v-icon>more_vert</v-icon>
        </v-btn>
        <v-list>
          <v-list-item v-for="item in items" :key="item">
            <v-list-tile>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>              
            </v-list-tile>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-toolbar-item class="hidden-sm-and-down">
        <img style="height:70%;width:auto" v-bind:src="logo"/>
      </v-toolbar-item>
      <v-toolbar-item class="hidden-sm-and-down" v-for="link in links" :href="link.href" :key="link.href" :target="link.target">{{ link.title }}</v-toolbar-item>    
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>


import settings from './application/settings'
import statistics from './application/statistics'
import plexsettings from './application/plexsettings'

export default {
    components: {
        settings,
        plexsettings,
        statistics,
    },
    data () {
        return {
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
            return this.logos.light.small
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
            return (this.ptConnected && this.ptServer && this.ptRoom && this.shortUrl)
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
