<template>
    <v-layout wrap row class="text-xs-center">
      <v-flex xs12 md8 offset-md2>
        <v-card style="background: rgba(0,0,0,0.3)">
          <h1 class="white--text pa-1"> Welcome to SyncLounge!</h1>
          <div>
            <h2>
              <span style="font-weight:900">{{ owner }}</span> has invited you to join the room
              <span style="font-weight:900">{{ room }}</span>
            </h2>
          </div>
          <v-layout wrap row class="pa-4">
            <v-flex xs12 md8 offset-md2 class="center-text">
              <v-btn class="center" style="background-color: #E5A00D" @click.native="letsGo()">Accept Invite</v-btn>
              </v-flex>
            </v-layout>
          <p style="opacity:0.7" class="center-text">
            SyncLounge is a tool to sync Plex content with your family and friends. For more info click <a target="_blank" href="https://github.com/samcm/synclounge"> here </a>
          </p>
        </v-card>
      </v-flex>
    </v-layout>
</template>
<script>
// CSS imports

export default {
  name: 'join',
  mounted: function () {
    this.password = this.$route.query.password
    this.room = this.$route.query.room
    this.server = this.$route.query.server
    this.owner = this.$route.query.owner

    if (this.room && this.server) {
      // Looks like a valid request...
      // Lets setup an auto join and then move the user to /sync
    }
  },
  data () {
    return {
      server: null,
      password: null,
      room: null,
      owner: null
    }
  },
  computed: {
    logo: function () {
      return this.$store.getters.logos.light.short
    }
  },
  methods: {
    async letsGo () {
      if (window.localStorage.getItem('plexuser')) {
        console.log('Auto joining')
        await this.$store.dispatch('autoJoin', {
          server: this.server,
          password: this.password,
          room: this.room
        })
        this.$router.push('/browse')
      } else {
        this.$store.commit('SET_AUTOJOIN', true)
        this.$store.commit('SET_AUTOJOINROOM', this.room)
        this.$store.commit('SET_AUTOJOINPASSWORD', this.password)
        this.$store.commit('SET_AUTOJOINURL', this.server)
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
