<template>
  <v-row
    class="pt-2 pa-4"
    justify="center"
  >
    <v-col md="8">
      <v-card
        style="background: rgba(0,0,0,0.3)"
        class="pa-4"
      >
        <v-layout
          v-if="ready"
          row
          wrap
          justify-center
          align-center
        >
          <v-flex
            xs12
            sm8
            lg4
          >
            <h1 class="text-center pa-2">
              Hello
              <span style="font-weight: 700">{{ plex.user.username }}</span>!
            </h1>
            <p>
              Would you like to change your display name when using SyncLounge? By default your
              Plex.tv username will be used. You can always change this setting later.
            </p>
            <v-checkbox
              v-model="HIDEUSERNAME"
              class="pt-2"
              label="Change my display name"
            />
            <v-text-field
              v-if="HIDEUSERNAME"
              :value="GET_ALTUSERNAME"
              label="Alternative display name"
              @change="SET_ALTUSERNAME"
            />
            <div class="text-xs-right">
              <v-btn
                color="primary"
                @click="letsGo"
              >
                Get started
              </v-btn>
            </div>
          </v-flex>
        </v-layout>
        <div v-else>
          <h1
            v-if="!GET_PLEX_AUTH_TOKEN"
            class="center-text pa-4"
          >
            To use SyncLounge you need to sign in with your Plex account.
          </h1>
          <div v-if="!preAuth || checkingAuth">
            <v-layout
              wrap
              row
              style="position:relative"
            >
              <v-flex
                xs12
                md4
                offset-md4
              >
                <div style="width:100%;text-align:center">
                  <v-progress-circular
                    indeterminate
                    :size="50"
                    class="amber--text"
                    style="display:inline-block"
                  />
                </div>
              </v-flex>
            </v-layout>
          </div>
          <div
            v-if="preAuth && !checkingAuth && !authError"
            class="text-center"
          >
            <v-btn
              class="primary"
              @click="openPopup()"
            >
              Sign in with Plex
            </v-btn>
          </div>
          <div
            v-if="authError"
            class="text-center error"
          >
            <p>You are not authorized to access this server</p>
          </div>
          <v-row
            justify="center"
            class="pt-4 pa-2"
          >
            <v-col
              md="8"
              class="center-text"
            >
              <p style="opacity:0.7">
                Your Plex account is used to fetch the details of your Plex devices. None of your
                private details are sent to our servers. If you would like to install and run
                SyncLounge yourself have a look
                <a
                  target="_blank"
                  href="https://github.com/samcm/SyncLounge"
                >here</a>
                for details.
              </p>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import axios from 'axios';
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  name: 'Signin',
  data() {
    return {
      pin: null,
      ID: null,
      status: 'startup',
      headers: {
        'X-Plex-Device': 'Web',
        'X-Plex-Device-Name': 'SyncLounge',
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Version': this.getAppVersion,
        'X-Plex-Platform-Version': '',
        'X-Plex-Client-Identifier': this.GET_CLIENTIDENTIFIER,
      },
      code: null,
      preAuth: false,
      checkingAuth: false,
      ready: false,
      openedWindow: null,
      authError: null,
      interval: 2000,
      id: '',
    };
  },
  methods: {
    ...mapActions(['PLEX_CHECK_AUTH', 'PLEX_LOGIN_TOKEN']),
    ...mapMutations('settings', ['SET_HIDEUSERNAME', 'SET_ALTUSERNAME', 'SET_PLEX_AUTH_TOKEN']),
    async openPopup() {
      this.openedWindow = window.open(this.url, '_blank');
      this.ticker = setInterval(async () => {
        console.log('ticker');
        const result = await axios(`https://plex.tv/api/v2/pins/${this.id}`, {
          headers: { ...this.headers },
        });
        if (result && result.data && result.data.authToken) {
          if (this.openedWindow) {
            this.openedWindow.close();
          }
          const authenticated = await this.checkAuth(result.data.authToken);
          if (authenticated) {
            await this.setAuth(result.data.authToken);
            this.letsGo();
          } else {
            this.authError = 'You are not authorized to access this server.';
          }
          clearInterval(this.ticker);
        }
      }, this.interval);
    },
    async setAuth(authToken) {
      this.SET_PLEX_AUTH_TOKEN(authToken);
      await this.PLEX_LOGIN_TOKEN(authToken);
      this.token = authToken;
      this.ready = true;
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
      this.checkingAuth = true;
      const result = await this.PLEX_CHECK_AUTH(authToken);
      this.checkingAuth = false;
      return result;
    },
  },
  computed: {
    ...mapGetters(['getAppVersion']),
    ...mapGetters('settings', [
      'GET_HIDEUSERNAME',
      'GET_ALTUSERNAME',
      'GET_PLEX_AUTH_TOKEN',
      'GET_CLIENTIDENTIFIER',
    ]),
    HIDEUSERNAME: {
      get() {
        return this.GET_HIDEUSERNAME;
      },
      set(value) {
        this.SET_HIDEUSERNAME(value);
      },
    },
    sBrowser() {
      let sBrowser;
      const sUsrAg = navigator.userAgent;

      if (sUsrAg.indexOf('Chrome') > -1) {
        sBrowser = 'Google Chrome';
      } else if (sUsrAg.indexOf('Safari') > -1) {
        sBrowser = 'Apple Safari';
        // this.openPopup();
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
  beforeDestroy() {
    clearInterval(this.ticker);
  },
  async mounted() {
    let authToken = null;
    // Check for PlexToken set via SyncLounge or Plex
    if ($cookies.get('mpt')) {
      console.log('WTFFFFFFFFFFF');
      authToken = $cookies.get('mpt');
    }

    if (authToken) {
      this.ticker = setInterval(async () => {
        try {
          console.log('--- Check Auth mounted ---');
          const authenticated = await this.checkAuth(authToken);
          if (authenticated != null) {
            if (authenticated === true) {
              await this.setAuth(authToken);
              this.letsGo();
            } else {
              this.authError = 'You are not authorized to access this server.';
            }
            this.preAuth = true;
            clearInterval(this.ticker);
          }
        } catch (e) {}
      }, 2000);
    } else {
      const { data } = await axios
        .create()
        .post('https://plex.tv/api/v2/pins?strong=true', {}, { headers: { ...this.headers } });
      this.code = data.code;
      this.id = data.id;
      this.headers['X-Plex-Platform'] = this.sBrowser;
      this.preAuth = true;
    }
  },
};
</script>
