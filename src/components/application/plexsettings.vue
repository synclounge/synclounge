<template>
  <div>
    <div class="pt-1 text-xs-left">
      <h4 style="text-align:initial">
        Blocked Plex Servers
      </h4>
      <small>Used for autoplay functionality. Use this list to block SyncLounge from searching certain
        servers when attempting to autoplay content.</small>
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
    <v-layout
      row
      wrap
    >
      <v-flex xs12 />
    </v-layout>
    <v-divider />
    <div class="pt-4 text-xs-left">
      <h4 style="text-align:initial">
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
  name: 'Plexsettings',
  methods: {
    ...mapMutations('settings', ['SET_HIDEUSERNAME', 'SET_ALTUSERNAME', 'SET_BLOCKEDSERVERS']),
  },
  computed: {
    ...mapGetters(['getPlex']),
    ...mapGetters('settings', ['GET_HIDEUSERNAME', 'GET_ALTUSERNAME', 'GET_BLOCKEDSERVERS']),
    BLOCKEDSERVERS: {
      get() {
        return this.GET_BLOCKEDSERVERS;
      },
      set(value) {
        this.SET_BLOCKEDSERVERS(value);
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
      // TODO: FIX THIS please
      const servers = [];
      if (!this.getPlex || !this.getPlex.servers) {
        return servers;
      }
      for (const id in this.getPlex.servers) {
        const server = this.getPlex.servers[id];
        if (this.GET_BLOCKEDSERVERS[server]) {
          servers.push({
            name: server.name,
            id: server.clientIdentifier,
          });
          return;
        }
        servers.push({
          name: server.name,
          id: server.clientIdentifier,
        });
      }
      return servers;
    },
  },
};
</script>
