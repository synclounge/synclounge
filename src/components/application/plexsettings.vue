<template>
  <div>
    <div class="pt-1 text-xs-left">
      <h4 style="text-align:initial">Blocked Plex Servers</h4>
      <small>Used for autoplay functionality. Use this list to block SyncLounge from searching certain servers when attempting to autoplay content.</small>
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
      <v-text-field v-if="HIDEUSERNAME" v-model="ALTUSERNAME" label="Alternative username"></v-text-field>
      <small>By default SyncLounge uses your Plex.tv username when you join a room.</small>
    </div>
  </div>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'plexsettings',
  data () {
    return {
      blockedServers: this.getSettings().BLOCKEDSERVERS,
    }
  },
  watch: {
    blockedServers: function () {
      this.setSetting(['BLOCKEDSERVERS', this.blockedServers])
    }
  },
  methods: {
    ...mapGetters(['getSettings']),
    ...mapMutations(['setSetting']),
  },
  computed: {
    plex: function () {
      return this.$store.state.plex
    },
    context: function () {
      return this.$store
    },
    HIDEUSERNAME: {
      get () {
        return this.getSettings().HIDEUSERNAME
      },
      set (value) {
        this.$store.commit('setSetting', ['HIDEUSERNAME', value])
      }
    },
    ALTUSERNAME: {
      get () {
        return this.$store.getters.getSettings['ALTUSERNAME']
      },
      set (value) {
        this.$store.commit('setSetting', ['ALTUSERNAME', value])
      }
    },
    localServersList: function () {
      let servers = []
      if (!this.plex || !this.plex.servers) {
        return servers
      }
      for (let id in this.plex.servers) {
        let server = this.plex.servers[id]
        if (this.getSettings().BLOCKEDSERVERS && this.getSettings().BLOCKEDSERVERS[server]) {
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
}
</script>
