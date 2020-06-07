<template>
  <v-row
    class="pt-2 pa-4"
    justify="center"
  >
    <v-col md="8">
      <v-card
        :loading="loading"
        style="background: rgba(0,0,0,0.3)"
        class="pa-4"
      >
        <v-card-title>
          Sign in with Plex
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
            text
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
      authWindow: null,
    };
  },

  computed: {
    ...mapGetters([
      'GET_PLEX_AUTH_URL',
    ]),
  },

  methods: {
    ...mapActions([
      'REQUEST_PLEX_INIT_AUTH',
      'REQUEST_PLEX_AUTH_TOKEN',
    ]),

    async authenticate() {
      this.loading = true;
      this.plexAuthResponse = await this.REQUEST_PLEX_INIT_AUTH();

      this.openPlexAuthWindow();

      // Start checking for valid auth response
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const delayPromise = delay(2000);

        // eslint-disable-next-line no-await-in-loop
        const isComplete = await this.isAuthComplete();
        if (isComplete) {
          if (this.authWindow) {
            this.authWindow.close();
          }

          this.$router.push('/');
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;
      }
    },

    openPlexAuthWindow() {
      this.authWindow = window.open(
        this.GET_PLEX_AUTH_URL(this.plexAuthResponse.code),
        '_blank',
        'resizable=1,width=395,height=560',
      );
    },

    async isAuthComplete() {
      try {
        await this.REQUEST_PLEX_AUTH_TOKEN(this.plexAuthResponse.id);
        return true;
      } catch {
        return false;
      }
    },
  },
};
</script>
