<template>
    <v-layout wrap row class="text-xs-center" justify-center align-center>
      <v-flex v-if="!loading" xs12 md5>
        <v-card style="background: rgba(0,0,0,0.3)" class="pa-1">
          <v-container fill-height>
            <v-layout row wrap>
              <v-flex xs12 md3 class="text-xs-center">
                <img :src="logos.light.small" style="width: 90%"/>
              </v-flex>
              <v-flex md9>
                <h1 class="white--text pa-1"> Welcome to SyncLounge!</h1>
                <div class="pt-2">
                  <div>
                    <span style="font-weight:900">{{ owner }}</span> has invited you to join the room
                    <span style="font-weight:900">{{ room }}</span>
                  </div>
                </div>
                <v-layout wrap row class="pa-4 pt-2" justify-center align-center>
                  <v-flex xs12 md8 class="text-xs-center">
                    <v-btn class="center" style="background-color: #E5A00D" @click.native="letsGo()">Accept Invite</v-btn>
                  </v-flex>
                </v-layout>
                </v-flex>
              </v-layout>
            </v-container>
            <v-divider></v-divider>
            <p style="opacity:0.7" class="text-xs-center pt-3">
              SyncLounge is a tool to sync Plex content with your family and friends. For more info click <a target="_blank" href="https://github.com/samcm/synclounge"> here</a>.
            </p>
        </v-card>
      </v-flex>
      <v-flex v-else>
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-flex>
    </v-layout>
</template>
<script>
// CSS imports

export default {
  name: 'join',
  mounted: function () {
    this.password = this.$route.query.password || ''
    this.room = this.$route.query.room
    this.server = this.$route.query.server
    this.owner = this.$route.query.owner
  },
  data () {
    return {
      server: null,
      password: null,
      room: null,
      owner: null
    }
  },
  watch: {
    gotDevices: function (to, from) {
      console.log('plex changed', to)
      if (to) {
        console.log('autojoin is', this.$route.query.autojoin)
        if (this.$route.query.autojoin) {
          this.letsGo()
        }
      }
    }
  },
  computed: {
    logo: function () {
      return this.$store.getters.logos.light.short
    },
    gotDevices: function () {
      return this.$store.state.plex.gotDevices
    },
    loading: function () {
      if (!window.localStorage.getItem('plexuser')) {
        return false
      }
      return !this.$store.state.plex.gotDevices
    }
  },
  methods: {
    async letsGo () {
      console.log('Doing autojoin')
      this.$store.commit('SET_AUTOJOIN', true)
      this.$store.commit('SET_AUTOJOINROOM', this.room)
      this.$store.commit('SET_AUTOJOINPASSWORD', this.password)
      this.$store.commit('SET_VALUE', ['autoJoinOwner', this.owner])
      this.$store.commit('SET_AUTOJOINURL', this.server)
      if (window.localStorage.getItem('plexuser')) {
        console.log('Auto joining')
        await this.$store.dispatch('autoJoin', {
          server: this.server,
          password: this.password,
          room: this.room
        })
        this.$router.push('/browse')
      } else {
        this.$router.push('/signin')
      }
      // this.$store.dispatch('socketConnect', {
      //   address: this.$store.getters.getAutoJoinUrl,
      //   callback: function () {
      //     let temporaryObj = {
      //     user: this.plex.user,
      //     roomName: this.room.toLowerCase(),
      //     password: this.password
      //   }
      //   this.$store.dispatch('joinRoom', temporaryObj).then(() => {
      //     resolve()
      //   }).catch(e => {
      //     this.roomError = e
      //     return reject(e)
      //   })
      //   }
      // })
    }
  }

}
</script>
