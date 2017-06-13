<template>
  <v-app dark>
    <main>
        <v-layout>
          <v-flex xs12 lg6 offset-lg3>
            <img style="max-width:100%" v-bind:src="logo">
          </v-flex>
        </v-layout>
        <v-layout>
          <v-flex lg3 offset lg9>
            <h1 class="right" style="color:white">G'day</h1>
          </v-flex>
        </v-layout>
        <v-layout>
          <v-flex xs12>
            <p> Plex Together is a tool to sync Plex playback with friends and family anywhere in the world.
              We started off with a Python script which we distributed amongst our friends. With a command line based UI we quickly realised this was too difficult for our friends to use reliably.
              After playing around with the concept we decided to make a version that we could release that all Plex users could enjoy.
            </p>
            <h2> How it works </h2>
            <p>
              Plex Together aims to keep multiple viewing sessions in sync regardless of whether the clients are in the same room or across the globe. To do this Plex Together utilizes a middle-man server to communicate between each of Plex Together clients.
              Users choose their Plex client, decide on a Plex Together Server and Room name and join up. Your friends/family can do the same. Whoever joins the room first will become the host.
            </p>
            <p>
              The host has complete control over a room. Commands they send to their client will be sent through to other people in the room (Play, Pause, Seek etc). If the host starts playing something different,
              Plex Together will search all of your available Plex Media Servers for an equiavalent copy, even if it is not from the same Plex Media Server as the Host.
            </p>
            <h2> Get involved </h2>
            <p> If you'd like to get involved with development head over to the <a
              href="https://github.com/samcm/plextogether" target="_blank">Github repo</a>. Feature and pull requests are greatly appreciated and we'll do our best to include them.
              The project is still early in development so if you find a bug please report it.
              If you would like to donate towards keeping the Plex Together Servers alive or just as a thanks you can donate <a
                href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=TKAR59DZ4HPWC&lc=AU&item_name=Plex%20Together&currency_code=AUD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted"
                target="_blank"> here</a>.
            </p>
            <p> We also have a Discord server setup. To join click <a href="https://discord.gg/fKQB3yt" target="_blank">here</a>.
            <h2> About </h2>
            <p>
              The project is entirely open source and can be installed and run completely independant of plextogether.com. If you would like to run your own instance visit the project's <a
              href="https://github.com/samcm/plextogether" target="_blank">Github repo</a>.
              For ease of use we have chosen to run a handful of public Plex Together Servers. These servers do not log any data to disk and merely pass-through data between other users in your room.
              We recommend running your own Plex Together Server if you would like to have a more consistent experience.
            </p>
            <p>
              Plex Together is licensed under the terms of the MIT license and is in no way affiliated with Plex Inc. </p>

            <div class="center">
              <p> We hope you enjoy. </p>
              <router-link to="/sync" class="center nav-item nav-link"> Let's get started. </router-link>
            </div>
          </v-flex>
        </v-layout>
    </main>    
  </v-app>
  
</template>

<script>
  export default {
    name: 'home',
    created: function () {
      if (this.$store.getters.getSettingHOMEINIT) {
        this.$router.push('/sync')
      }
    },
    mounted: function () {
      this.$store.commit('setSettingHOMEINIT', true)
    },
    methods: {
      letsStart: function () {
        this.$router.push('/')
      }
    },
    computed: {
      logo: function () {
        return 'static/logo-long-light.png'
      },
      firstRun: function () {
        return !this.$store.getters.getSettingHOMEINIT
      }
    }
  }
</script>

