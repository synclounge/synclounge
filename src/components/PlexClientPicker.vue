<template>
  <v-list
    dense
  >
    <v-alert
      v-if="error"
      prominent
      type="error"
    >
      <v-row align="center">
        <v-col>
          Unable to connect to client.
        </v-col>

        <v-col
          v-if="isHttps"
          cols="auto"
        >
          Try with http
          <v-btn
            :href="httpLink"
            class="ml-1"
            color="warning"
          >
            Try
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>

    <v-subheader>
      Plex Players
      <v-btn
        icon
        x-small
        @click="FETCH_PLEX_DEVICES"
      >
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-subheader>

    <v-list-item-group
      mandatory
      :value="GET_CHOSEN_CLIENT_ID"
      @change="onClientClicked"
    >
      <PlexClient
        v-for="id in GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN"
        :key="id"
        :value="id"
        :client-id="id"
      />
    </v-list-item-group>
  </v-list>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  name: 'PlexClientPicker',

  components: {
    PlexClient: () => import('@/components/PlexClient.vue'),
  },

  data() {
    return {
      error: false,
      abortController: null,
    };
  },

  computed: {
    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN',
    ]),

    isHttps() {
      return window.location.protocol === 'https:';
    },

    httpLink() {
      return `http:${window.location.href.substring(window.location.protocol.length)}`;
    },
  },

  beforeDestroy() {
    this.cancelRequests();
  },

  methods: {
    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
    ]),

    ...mapActions('plexclients', [
      'FIND_AND_SET_CONNECTION',
    ]),

    ...mapMutations('plexclients', [
      'SET_CHOSEN_CLIENT_ID',
    ]),

    cancelRequests() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    },

    async onClientClicked(clientIdentifier) {
      this.cancelRequests();
      const controller = new AbortController();
      this.abortController = controller;
      this.$emit('loadingChange', true);
      this.$emit('clientConnectableChange', false);
      this.error = false;

      try {
        await this.FIND_AND_SET_CONNECTION({
          clientIdentifier,
          signal: controller.signal,
        });
        this.SET_CHOSEN_CLIENT_ID(clientIdentifier);
        this.$emit('clientConnectableChange', true);
      } catch (e) {
        if (controller.signal.aborted) {
          // If we aborted, ignore errors and return immediately
          return;
        }
        console.error(e);
        this.error = true;
      }

      this.abortController = null;

      this.$emit('loadingChange', false);
    },
  },
};
</script>
