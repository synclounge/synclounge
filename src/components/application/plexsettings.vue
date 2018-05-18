<template>
  <div>
    <h6>Blocked Plex Servers</h6>
    <small>Used for autoplay functionality. Use this list to block SyncLounge from searching certain servers when attempting to autoplay content.</small>
    <v-layout row wrap>
      <v-flex xs12>
        <v-select
          label="Select"
          :items="localServersList"
          v-model="blockedServers"
          item-value="id"
          item-text="name"
          multiple
          hint="Blocked Servers"
          persistent-hint
        ></v-select>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: 'plexsettings',
  data () {
    return {
      blockedServers: this.$store.getters.getSettingBLOCKEDSERVERS || []
    }
  },
  methods: {},

  watch: {
    blockedServers: function () {
      this.$store.commit('setSetting', ['BLOCKEDSERVERS', this.blockedServers])
    }
  },
  computed: {
    plex: function () {
      return this.$store.state.plex
    },
    context: function () {
      return this.$store
    },
    localServersList: function () {
      let servers = []
      if (!this.plex || !this.plex.servers) {
        return servers
      }
      for (let id in this.plex.servers) {
        let server = this.plex.servers[id]
        if (this.$store.getters.getSettings['BLOCKEDSERVERS'] && this.$store.getters.getSettings['BLOCKEDSERVERS'][server.clientIdentifier]) {
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
  },
  mounted: function () {
    // Create event listeners
  }
}
</script>
