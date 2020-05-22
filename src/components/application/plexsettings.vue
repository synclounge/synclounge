<template>
  <div>
    <div class="pt-1 text-xs-left">
      <h4 style="text-align:initial">Blocked Plex Servers</h4>
      <small>Used for autoplay functionality. Use this list to block SyncLounge from searching certain servers when attempting to autoplay content.</small>
      <v-select
          label="Select"
          :items="localServersList"
          v-model="BLOCKEDSERVERS"
          item-value="id"
          item-text="name"
          multiple
          hint="Blocked Servers"
          persistent-hint
        ></v-select>
    </div>
    <v-layout row wrap>
      <v-flex xs12>
      </v-flex>
    </v-layout>
    <v-divider></v-divider>
    <div class="pt-4 text-xs-left">
      <h4 style="text-align:initial">Change display name</h4>
      <v-checkbox
        label="Enabled"
        v-model="HIDEUSERNAME"
      ></v-checkbox>
      <v-text-field v-if="HIDEUSERNAME" :value="GET_ALTUSERNAME" @change="SET_ALTUSERNAME" label="Alternative username"></v-text-field>
      <small>By default SyncLounge uses your Plex.tv username when you join a room.</small>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'plexsettings',
  methods: {
    ...mapMutations('settings', [
      'SET_HIDEUSERNAME',
      'SET_ALTUSERNAME',
      'SET_BLOCKEDSERVERS'
    ])
  },
  computed: {
    ...mapGetters('settings', [
      'GET_HIDEUSERNAME',
      'GET_ALTUSERNAME',
      'GET_BLOCKEDSERVERS'
    ]),
    plex: function () {
      return this.$store.state.plex
    },
    BLOCKEDSERVERS: {
      get() {
        return this.GET_BLOCKEDSERVERS;
      },
      set(value) {
        this.SET_BLOCKEDSERVERS(value);
      }
    },
    HIDEUSERNAME: {
      get() {
        return this.GET_HIDEUSERNAME;
      },
      set(value) {
         this.SET_HIDEUSERNAME(value);
      }
    },
    localServersList: function () {
      // TODO: FIX THIS please
      let servers = []
      if (!this.plex || !this.plex.servers) {
        return servers
      }
      for (let id in this.plex.servers) {
        let server = this.plex.servers[id]
        if (this.GET_BLOCKEDSERVERS[server]) {
          servers.push({
            name: server.name,
            id: server.clientIdentifier
          })
          return
        }
        servers.push({
          name: server.name,
          id: server.clientIdentifier
        })
      }
      return servers
    }
  }
}
</script>