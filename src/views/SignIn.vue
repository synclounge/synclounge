<template>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col>
        <v-card
          class="mx-auto"
          max-width="550"
          :loading="loading"
        >
          <v-alert
            v-if="GET_PLEX_AUTH_TOKEN && IS_USER_AUTHORIZED === false"
            type="error"
          >
            You are not authorized to access this server
          </v-alert>

          <v-card-title>
            <v-img
              contain
              src="@/assets/images/logos/logo-long-light.png"
            />
          </v-card-title>

          <v-card-actions>
            <v-btn
              class="primary"
              target="_blank"
              x-large
              text
              :disabled="allowSignIn"
              :href="plexAuthUrl"
              @click="authenticate"
            >
              Sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { CAF } from 'caf';

import getCookie from '@/utils/getcookie';

export default {
  name: 'SignIn',

  data: () => ({
    loading: false,
    plexAuthResponse: null,
    cancelToken: null,
  }),

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_AUTH_URL',
      'IS_USER_AUTHORIZED',
      'GET_PLEX_AUTH_TOKEN',
    ]),

    plexAuthUrl() {
      if (!this.plexAuthResponse) {
        return '';
      }

      return this.GET_PLEX_AUTH_URL(this.plexAuthResponse.code);
    },

    allowSignIn() {
      return this.loading || !this.plexAuthResponse
      || (!this.IS_USER_AUTHORIZED && !!this.GET_PLEX_AUTH_TOKEN);
    },
  },

  async created() {
    if (this.IS_USER_AUTHORIZED && this.GET_PLEX_AUTH_TOKEN) {
      this.redirect();
      return;
    }

    const cookieToken = getCookie('mpt');
    if (cookieToken) {
      await this.cookieAuth(cookieToken);
    } else {
      await this.regularAuth();
    }
  },

  beforeDestroy() {
    if (this.cancelToken) {
      this.cancelToken.abort();
      this.cancelToken = null;
    }
  },

  methods: {
    ...mapActions('plex', [
      'FETCH_PLEX_INIT_AUTH',
      'REQUEST_PLEX_AUTH_TOKEN',
      'FETCH_PLEX_DEVICES_IF_NEEDED',
      'FETCH_PLEX_USER',
    ]),

    ...mapActions('plexservers', [
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapMutations('plex', [
      'SET_PLEX_AUTH_TOKEN',
    ]),

    async regularAuth() {
      await this.fetchInitialAuthCode();
    },

    async cookieAuth(token) {
      // Used by Organizr: https://github.com/causefx/Organizr/issues/1344
      this.loading = true;
      this.SET_PLEX_AUTH_TOKEN(token);
      try {
        await this.FETCH_PLEX_USER();
        await this.postAuth();
        this.loading = false;
      } catch (e) {
        console.error(e);
        // If this fails, then the auth token is probably invalid
        this.SET_PLEX_AUTH_TOKEN(null);
        await this.regularAuth();
      }
    },

    async fetchInitialAuthCode() {
      this.loading = true;
      // eslint-disable-next-line new-cap
      this.cancelToken = new CAF.cancelToken();
      this.plexAuthResponse = await this.FETCH_PLEX_INIT_AUTH(this.cancelToken.signal);
      this.cancelToken = null;
      this.loading = false;
    },

    async authenticate() {
      this.loading = true;
      // eslint-disable-next-line new-cap
      this.cancelToken = new CAF.cancelToken();
      await this.plexAuthChecker(this.cancelToken.signal);

      await this.postAuth();
      this.loading = false;
    },

    redirect() {
      this.$router.push(this.$route.query.redirect || '/');
    },

    async postAuth() {
      this.redirect();
      await this.FETCH_PLEX_DEVICES_IF_NEEDED();
      await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE();
    },

    plexAuthChecker: CAF(function* plexAuthChecker(signal) {
      while (true) {
        yield CAF.delay(signal, this.GET_CONFIG.plex_auth_check_interval);

        const isComplete = yield this.isAuthComplete(signal);
        if (isComplete) {
          return;
        }
      }
    }),

    async isAuthComplete(signal) {
      try {
        await this.REQUEST_PLEX_AUTH_TOKEN({
          signal,
          id: this.plexAuthResponse.id,
        });

        return true;
      } catch {
        return false;
      }
    },
  },
};
</script>
