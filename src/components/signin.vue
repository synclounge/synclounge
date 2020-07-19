<template>
  <v-row
    class="pt-2 pa-4"
    justify="center"
  >
    <v-col
      md="6"
      lg="5"
    >
      <v-card
        :loading="loading"
        style="background: rgba(0,0,0,0.3)"
        class="pa-4"
      >
        <v-alert
          v-if="IS_USER_AUTHORIZED === false"
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

        <v-card-text>
          Your Plex account is used to fetch the details of your Plex devices. None of your
          private details are sent to our servers. If you would like to install and run
          SyncLounge yourself have a look
          <a
            target="_blank"
            href="https://github.com/samcm/SyncLounge"
          >here</a>
          for details.
        </v-card-text>

        <v-card-actions>
          <v-btn
            class="primary"
            target="_blank"
            x-large
            text
            :disabled="loading || !plexAuthResponse"
            :href="plexAuthUrl"
            @click="authenticate"
          >
            Sign in
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import CAF from 'caf';

export default {
  data() {
    return {
      loading: false,
      plexAuthResponse: null,
      cancelToken: null,
    };
  },

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_AUTH_URL',
      'IS_USER_AUTHORIZED',
    ]),

    plexAuthUrl() {
      if (!this.plexAuthResponse) {
        return '';
      }

      return this.GET_PLEX_AUTH_URL(this.plexAuthResponse.code);
    },
  },

  created() {
    this.fetchInitialAuthCode();
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
    ]),

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

      await this.FETCH_PLEX_DEVICES_IF_NEEDED();
      if (this.IS_USER_AUTHORIZED) {
        this.$router.push(this.$route.query.redirect || '/');
      }
      this.loading = false;
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
