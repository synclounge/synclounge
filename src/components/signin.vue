<template>
  <v-layout wrap row ckass="pt-2 pa-4" justify-center>
    <v-flex xs12 md8>
      <v-card style="background: rgba(0,0,0,0.3)" class="pa-4">
        <h1 v-if="!token" :style="fontSizes.largest" class="center-text pa-4">Sign in to Plex.tv</h1>
        <div v-if="!code">
          <v-layout wrap row style="position:relative">
            <v-flex xs12 md4 offset-md4>
              <div style="width:100%;text-align:center">
                <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
              </div>
            </v-flex>
          </v-layout>
        </div>
        <div v-if="token" class="center-text" style="font-size:400%">
          <v-icon class="green--text text--darken-2" style="font-size: 120px">done</v-icon>
          <h3 class="white--text">
            Signed in!
          </h3>
        </div>
        <div v-if="code" class="text-xs-center">
          <v-btn class="primary" :href="url" target="_blank">Sign in via Plex.tv</v-btn>
        </div>        
        <v-layout wrap row class="pt-4 pa-2">
          <v-flex xs12 md8 offset-md2 class="center-text">
            <p style="opacity:0.7">
              Your Plex account is used to fetch the details of your Plex devices. None of your private details are sent to our servers. If you would like to install and run SyncLounge yourself
              have a look <a target="_blank" href="https://github.com/samcm/SyncLounge"> here </a>
              for details.
            </p>
          </v-flex>
        </v-layout><p class="center-text soft-text pt-4 mt-5">
          Click <router-link to="/pinsignin">here</router-link> to sign in via the pin method
        </p>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
var axios = require('axios')
export default {
  name: 'signin',
  data () {
    return {
      pin: null,
      ID: null,
      token: null,
      status: 'startup',
      headers: {
        'X-Plex-Device': 'Web',
        'X-Plex-Device-Name': 'SyncLounge',
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': this.$store.state.appVersion,
        'X-Plex-Platform-Version': '',
        'X-Plex-Client-Identifier': 'SyncLounge v' + this.$store.state.appVersion
      },
      code: null

    }
  },
  computed: {
    store: function () {
      return this
    },
    sBrowser: function () {
      let sBrowser
      let sUsrAg = navigator.userAgent

      if (sUsrAg.indexOf('Chrome') > -1) {
        sBrowser = 'Google Chrome'
      } else if (sUsrAg.indexOf('Safari') > -1) {
        sBrowser = 'Apple Safari'
      } else if (sUsrAg.indexOf('Opera') > -1) {
        sBrowser = 'Opera'
      } else if (sUsrAg.indexOf('Firefox') > -1) {
        sBrowser = 'Mozilla Firefox'
      } else if (sUsrAg.indexOf('MSIE') > -1) {
        sBrowser = 'Microsoft Internet Explorer'
      }
      return sBrowser
    },
    url: function () {
      if (this.code) {
        return 'https://app.plex.tv/auth/#!?clientID=' + this.headers['X-Plex-Client-Identifier'] + '&code=' + this.code
      }
    }
  },
  async mounted () {
    this.headers['X-Plex-Platform'] = this.sBrowser
    let { data } = await axios.create().post('https://plex.tv/api/v2/pins?strong=true', {}, { headers: { ...this.headers } })
    console.log('Got back post request', data)
    this.code = data.code
    this.ticker = setInterval(async () => {
      let result = await axios('https://plex.tv/api/v2/pins/' + data.id, {
        headers: { ...this.headers }
      })
      console.log('Result form pin check', result)
      if (result && result.data && result.data.authToken) {
        clearInterval(this.ticker)
        window.localStorage.setItem('plexuser', JSON.stringify({ authToken: result.data.authToken }))
        await this.$store.dispatch('PLEX_LOGIN_TOKEN', result.data.authToken)
        this.$router.push('/browse')
      }
    }, 2000)
    // this.$http
    //   .post('https://plex.tv/pins.xml', null, {
    //     headers: {
    //       'X-Plex-Device': 'Web',
    //       'X-Plex-Device-Name': 'SyncLounge',
    //       'X-Plex-Product': 'SyncLounge',
    //       'X-Plex-Version': this.appVersion,
    //       'X-Plex-Platform': sBrowser,
    //       'X-Plex-Platform-Version': '',
    //       'X-Plex-Client-Identifier': id
    //     }
    //   })
    //   .then(response => {
    //     parseString(response.body, (err, result) => {
    //       if (!err) {
    //         this.pin = result.pin.code[0]
    //         this.ID = result.pin.id[0]._
    //         let checker = setInterval(() => {
    //           var options = {
    //             url: 'https://plex.tv/pins/' + result.pin.id[0]._ + '.xml',
                
    //           }
    //           request(options, (error, response, body) => {
    //             if (!error && response.statusCode === 404) {
    //               clearInterval(checker)
    //               return
    //             }
    //             if (!error && response.statusCode === 200) {
    //               parseString(body, async (err, result) => {
    //                 if (!err) {
    //                   if (
    //                     result.pin.auth_token[0] != null &&
    //                     result.pin.auth_token[0].length > 1
    //                   ) {
    //                     this.token = result.pin.auth_token[0]
    //                     let jsonObj = {
    //                       authToken: this.token
    //                     }
    //                     storage.setItem('plexuser', JSON.stringify(jsonObj))
    //                     await this.$store.dispatch(
    //                       'PLEX_LOGIN_TOKEN',
    //                       this.token
    //                     )
    //                     setTimeout(() => {
    //                       this.$router.push('/browse')
    //                     }, 2500)
    //                     clearInterval(checker)
    //                   }
    //                 }
    //               })
    //             }
    //           })
    //         }, 2000)
    //       }
    //     })
    // })
  },
  methods: {
    sendNotification () {
      window.EventBus.$emit('notification', 'Copied to clipboard')
    }
  }
}
</script>
