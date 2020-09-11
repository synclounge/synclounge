<template>
  <div>
    <div class="pt-1 text-xs-left">
      <h4 style="text-align: initial;">
        Blocked Plex Servers
      </h4>

      <small>
        Used for autoplay functionality.
        Use this list to block SyncLounge from searching certain servers when attempting to
        autoplay content.
      </small>

      <v-select
        v-model="BLOCKEDSERVERS"
        label="Select"
        :items="localServersList"
        item-value="id"
        item-text="name"
        multiple
        hint="Blocked Servers"
        persistent-hint
      />
    </div>

    <v-divider />

    <div class="pt-4 text-xs-left">
      <h4 style="text-align: initial;">
        Change display name
      </h4>

      <v-checkbox
        v-model="HIDEUSERNAME"
        label="Enabled"
      />

      <v-text-field
        v-if="HIDEUSERNAME"
        :value="GET_ALTUSERNAME"
        label="Alternative username"
        @change="SET_ALTUSERNAME"
      />
      <small>By default SyncLounge uses your Plex.tv username when you join a room.</small>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'ThePlexSettingsDialog',

  computed: {
    ...mapGetters('plexservers', [
      'GET_PLEX_SERVERS',
      'GET_BLOCKED_SERVER_IDS',
    ]),

    ...mapGetters('settings', [
      'GET_HIDEUSERNAME',
      'GET_ALTUSERNAME',
    ]),

    BLOCKEDSERVERS: {
      get() {
        return this.GET_BLOCKED_SERVER_IDS;
      },

      set(value) {
        this.SET_BLOCKED_SERVER_IDS(value);
      },
    },

    HIDEUSERNAME: {
      get() {
        return this.GET_HIDEUSERNAME;
      },

      set(value) {
        this.SET_HIDEUSERNAME(value);
      },
    },

    localServersList() {
      return this.GET_PLEX_SERVERS.map((server) => ({
        name: server.name,
        id: server.clientIdentifier,
      }));
    },
  },

  methods: {
    ...mapMutations('plexservers', [
      'SET_BLOCKED_SERVER_IDS',
    ]),

    ...mapMutations('settings', [
      'SET_HIDEUSERNAME',
      'SET_ALTUSERNAME',
    ]),
  },
};
</script>
