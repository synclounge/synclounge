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
        @click="
          FETCH_PLEX_DEVICES"
      >
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-subheader>

    <v-list-item-group
      mandatory
      :value="GET_CHOSEN_CLIENT_ID"
      @change="onClientClicked"
    >
      <plexclient
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
  components: {
    plexclient: () => import('@/components/plex/plexclient.vue'),
  },

  data() {
    return {
      error: false,
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

  async created() {
    await this.FETCH_PLEX_DEVICES_IF_NEEDED();
  },

  methods: {
    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES_IF_NEEDED',
      'FETCH_PLEX_DEVICES',
    ]),

    ...mapActions('plexclients', [
      'FIND_AND_SET_CONNECTION',
    ]),

    ...mapMutations('plexclients', [
      'SET_CHOSEN_CLIENT_ID',
    ]),

    async onClientClicked(id) {
      this.$emit('loadingChange', true);
      this.$emit('clientConnectableChange', false);
      this.error = false;

      try {
        await this.FIND_AND_SET_CONNECTION(id);
        this.SET_CHOSEN_CLIENT_ID(id);
        this.$emit('clientConnectableChange', true);
      } catch (e) {
        // TODO: maybe add lock or cancel test if user clicks on other client while previous is still checking
        console.log(e);
        this.error = true;
      }

      this.$emit('loadingChange', false);
    },
  },
};
</script>
