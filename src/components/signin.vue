<template>
  <v-layout wrap row ckass="pt-2 pa-4" justify-center>
    <v-flex xs12 md8>
      <v-card style="background: rgba(0,0,0,0.3)" class="pa-4">
        <v-layout row wrap justify-center align-center v-if="ready">
          <v-flex xs12 sm8 lg4>
            <h1 class="text-xs-center pa-2">Hello <span style="font-weight: 700">{{ plex.user.username }}</span>!</h1>
            <p>Would you like to change your display name when using SyncLounge? By default your Plex.tv username will be used. You can always change this setting later.</p>
            <v-checkbox
              class="pt-2"
              label="Change my display name"
              v-model="HIDEUSERNAME"
            ></v-checkbox>
            <v-text-field v-if="HIDEUSERNAME" v-model="ALTUSERNAME" label="Alternative display name"></v-text-field>
            <div class="text-xs-right">
              <v-btn @click="letsGo" color="primary">Get started</v-btn>
            </div>
          </v-flex>
        </v-layout>
        <div v-else>
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
          <div v-if="code && !authError" class="text-xs-center">
            <v-btn class="primary" @click="openPopup">Click me</v-btn>
          </div>
          <div v-if="authError" class="text-xs-center error">
            <p>
              You are not authorized to access this server
            </p>
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
        </div>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
const axios = require('axios');

export default {
  name: 'signin',
  data() {
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
        'X-Plex-Client-Identifier': this.$store.state.settings.CLIENTIDENTIFIER,
      },
      code: null,
      ready: false,
      openedWindow: null,
      authError: null,
    };
  },
  methods: {
    openPopup() {
      const w = 450;
      const h = 600;
      // Credit: https://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
      // Fixes dual-screen position                         Most browsers      Firefox
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

      const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
      const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

      const left = ((width / 2) - (w / 2)) + dualScreenLeft;
      const top = ((height / 2) - (h / 2)) + dualScreenTop;
      let newWindow = window.open(this.url, 'Sign in with Plex.tv', `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`);
      if (!newWindow) {
        newWindow = window.open(this.url, '_blank');
      }
      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus();
      }
      this.openedWindow = newWindow;
    },
    async letsGo() {
      if (this.$store.state.autoJoin) {
        this.$store.dispatch('autoJoin', {
          server: this.$store.state.autoJoinUrl,
          password: this.$store.state.autoJoinPassword,
          room: this.$store.state.autoJoinRoom,
        });
      }
      this.$router.push('/browse');
    },
    async checkAuth(authToken) {
      // Get stored authentication settings
      let authentication = this.$store.state.authentication;
      // Authentication defaults to false
      let authenticationPassed = false;

      // Authenication via Plex mechanism
      if (authentication.mechanism == 'plex') {
        // Server authorization using server data
        if(authentication.type.includes('server')) {
          // Retrieve and store the user's servers
          try {
            await this.$store.dispatch('PLEX_GET_SERVERS', authToken);
            // Get the user object
            let user = this.$store.state.plex.user;
            let servers = user.servers;

            // Compare servers against the authorized list
            let serverFound = false;
            for (const id in servers) {
              const server = servers[id].$;
              if(authentication.authorized.includes(server.machineIdentifier)) {
                authenticationPassed = true;
              }
            }
          }
          catch (e) {
            console.error('An error occurred when authenticating with Plex: ', e);
          }
        }
        // Authorization using user data
        if (authentication.type.includes('user')) {
          // Get the user object
          let user = this.$store.state.plex.user;
          // Compare the user's email against the authorized list
          if(authentication.authorized.includes(user.email)) {
            authenticationPassed = true;
          }
          // Compare the user's name against the authorized list
          if(authentication.authorized.includes(user.username)) {
            authenticationPassed = true;
          }
        }
      }
      // New authentication mechanisms can be added here
      // else if (authentication.mechanism == 'new_mech' ) {
      // }
      // Authenication via an unsupported mechanism
      else if (authentication.mechanism != 'none' ) {
        console.error(`Invalid authentication mechanism provided: '${authentication.mechanism}'. Reverting to default.`);
        this.$store.state.authentication = {
          mechanism: 'none'
        };
        authenticationPassed = true;
      }
      // Authenication mechanism isn't set. This should only happen when authentication mechanism is set to 'none'.
      else {
        console.log('No authentication set');
        authenticationPassed = true;
      }

      return authenticationPassed;
    }
  },
  computed: {
    store() {
      return this;
    },
    HIDEUSERNAME: {
      get() {
        return (this.$store.getters.getSettings.HIDEUSERNAME);
      },
      set(value) {
        this.$store.commit('setSetting', ['HIDEUSERNAME', value]);
      },
    },
    ALTUSERNAME: {
      get() {
        return this.$store.getters.getSettings.ALTUSERNAME;
      },
      set(value) {
        this.$store.commit('setSetting', ['ALTUSERNAME', value]);
      },
    },
    sBrowser() {
      let sBrowser;
      const sUsrAg = navigator.userAgent;

      if (sUsrAg.indexOf('Chrome') > -1) {
        sBrowser = 'Google Chrome';
      } else if (sUsrAg.indexOf('Safari') > -1) {
        sBrowser = 'Apple Safari';
      } else if (sUsrAg.indexOf('Opera') > -1) {
        sBrowser = 'Opera';
      } else if (sUsrAg.indexOf('Firefox') > -1) {
        sBrowser = 'Mozilla Firefox';
      } else if (sUsrAg.indexOf('MSIE') > -1) {
        sBrowser = 'Microsoft Internet Explorer';
      }
      return sBrowser;
    },
    url() {
      if (this.code) {
        return `https://app.plex.tv/auth/#!?clientID=${this.headers['X-Plex-Client-Identifier']}&code=${this.code}`;
      }
      return '';
    },
  },
  async mounted() {
    this.headers['X-Plex-Platform'] = this.sBrowser;
    const { data } = await axios.create().post('https://plex.tv/api/v2/pins?strong=true', {}, { headers: { ...this.headers } });
    this.code = data.code;
    this.ticker = setInterval(async () => {
      const result = await axios(`https://plex.tv/api/v2/pins/${data.id}`, {
        headers: { ...this.headers },
      });
      if (result && result.data && result.data.authToken) {
        if (this.openedWindow) {
          this.openedWindow.close();
        }
        let authenticated = await this.checkAuth(result.data.authToken);
        if(authenticated) {
          window.localStorage.setItem('plexuser', JSON.stringify({ authToken: result.data.authToken }));
          await this.$store.dispatch('PLEX_LOGIN_TOKEN', result.data.authToken);
          this.token = result.data.authToken;
          this.ready = true;

          this.letsGo();
        }
        else {
          this.authError = `You are not authorized to access this server.`;
        }
        clearInterval(this.ticker);
      }
    }, 2000);
  },
};
</script>
