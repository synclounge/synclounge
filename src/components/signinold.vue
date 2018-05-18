<template>
    <v-layout wrap row ckass="pt-2 pa-4" justify-center>
      <v-flex xs12 md8>
        <v-card style="background: rgba(0,0,0,0.3)" class="pa-4">
          <h1 v-if="!token" :style="fontSizes.largest" class="center-text pa-4">Sign in to Plex.tv</h1>
          <div v-if="!pin">
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
          <div v-if="pin && !token">
            <v-layout wrap row flex class="pt-4">
              <v-flex xs12 md6 offset-md3>
                <h1 :style="fontSizes.largest" class="center-text" color="primary" style="color:white !important; background-color: rgba(128, 128, 128, 0.2); letter-spacing:1px">{{ pin }}</h1>
                <v-layout wrap row flex class="pt-4">
                  <v-flex xs4 offset-xs4 >
                    <v-btn v-clipboard="pin" v-on:click.native="sendNotification()" primary class="primary" style="width:100%">
                      <v-icon class="mr-2">content_copy</v-icon>
                      Copy
                    </v-btn>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
            <p class="center-text pt-4">Enter the pin above at <a target="_blank" class="primary--text" href="https://plex.tv/link">
              https://plex.tv/link </a></p>
            </div>
            <v-layout wrap row class="pt-4 pa-2">
              <v-flex xs12 md8 offset-md2 class="center-text">
                <p style="opacity:0.7">
                  Your Plex account is used to fetch the details of your Plex devices. None of your private details are sent to our servers. If you would like to install and run SyncLounge yourself
                  have a look <a target="_blank" href="https://github.com/samcm/SyncLounge"> here </a>
                  for details.
                </p>
              </v-flex>
            </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
</template>

<script>
var parseString = require('xml2js').parseString
var request = require('request')

export default {
  name: 'signin',
  data () {
    return {
      pin: null,
      ID: null,
      token: null,
      status: 'startup'
    }
  },
  computed: {
    store: function () {
      return this
    }
  },
  mounted () {
    let storage = window['localStorage']
    let id = (Math.random() * 1e32).toString(36)
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

    this.$http
      .post('https://plex.tv/pins.xml', null, {
        headers: {
          'X-Plex-Device': 'Web',
          'X-Plex-Device-Name': 'SyncLounge',
          'X-Plex-Product': 'SyncLounge',
          'X-Plex-Version': this.appVersion,
          'X-Plex-Platform': sBrowser,
          'X-Plex-Platform-Version': '',
          'X-Plex-Client-Identifier': id
        }
      })
      .then(response => {
        parseString(response.body, (err, result) => {
          if (!err) {
            this.pin = result.pin.code[0]
            this.ID = result.pin.id[0]._
            let checker = setInterval(() => {
              var options = {
                url: 'https://plex.tv/pins/' + result.pin.id[0]._ + '.xml',
                headers: {
                  'X-Plex-Device': 'Web',
                  'X-Plex-Device-Name': 'SyncLounge',
                  'X-Plex-Product': 'SyncLounge',
                  'X-Plex-Version': this.appVersion,
                  'X-Plex-Platform': sBrowser,
                  'X-Plex-Platform-Version': '',
                  'X-Plex-Client-Identifier': id
                }
              }
              request(options, (error, response, body) => {
                if (!error && response.statusCode === 404) {
                  clearInterval(checker)
                  return
                }
                if (!error && response.statusCode === 200) {
                  parseString(body, async (err, result) => {
                    if (!err) {
                      if (
                        result.pin.auth_token[0] != null &&
                        result.pin.auth_token[0].length > 1
                      ) {
                        this.token = result.pin.auth_token[0]
                        let jsonObj = {
                          authToken: this.token
                        }
                        storage.setItem('plexuser', JSON.stringify(jsonObj))
                        await this.$store.dispatch(
                          'PLEX_LOGIN_TOKEN',
                          this.token
                        )
                        setTimeout(() => {
                          this.$router.push('/browse')
                        }, 2500)
                        clearInterval(checker)
                      }
                    }
                  })
                }
              })
            }, 2000)
          }
        })
      })
  },
  methods: {
    sendNotification () {
      window.EventBus.$emit('notification', 'Copied to clipboard')
    }
  }
}
</script>
