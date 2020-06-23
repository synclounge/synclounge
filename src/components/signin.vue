<template>
  <v-row
    class="pt-2 pa-4"
    justify="center"
  >
    <v-col md="4">
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
            :src="getLogos.light.long"
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
import delay from '@/utils/delay';

export default {
  name: 'Signin',
  data() {
    return {
      loading: false,
      authInterval: null,
      plexAuthResponse: null,
    };
  },

  computed: {
    ...mapGetters([
      'getLogos',
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

  methods: {
    ...mapActions('plex', [
      'REQUEST_PLEX_INIT_AUTH',
      'REQUEST_PLEX_AUTH_TOKEN',
      'FETCH_PLEX_DEVICES_IF_NEEDED',
    ]),

    async fetchInitialAuthCode() {
      this.loading = true;
      this.plexAuthResponse = await this.REQUEST_PLEX_INIT_AUTH();
      this.loading = false;
    },

    async authenticate() {
      this.loading = true;

      // Start checking for valid auth response
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const delayPromise = delay(2000);

        // eslint-disable-next-line no-await-in-loop
        const isComplete = await this.isAuthComplete();
        if (isComplete) {
          break;
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;
      }

      this.loading = false;

      if (this.IS_USER_AUTHORIZED) {
        this.$router.push(this.$route.query.redirect || '/');
      }
    },

    async isAuthComplete() {
      try {
        await this.REQUEST_PLEX_AUTH_TOKEN(this.plexAuthResponse.id);
        await this.FETCH_PLEX_DEVICES_IF_NEEDED();
        return true;
      } catch {
        return false;
      }
    },
  },
};
</script>
