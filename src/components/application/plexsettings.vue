<template>
  <div>
      <h6>Autoplay Plex Servers</h6>
      <small>Used for autoplay functionality. Use this list to block PlexTogether from searching certain servers when attempting to autoplay content.</small>
      <div v-if="plex && plex.gotDevices && plex.servers">
          <v-switch v-for="server in checked" :key="server" :label="server.name" v-model="checked" :value="server" light warning></v-switch>
      </div>
  </div>
</template>

<script>
  export default {
    props: ['object'],
    name: 'plexsettings',
    data () {
      return {
      }
    },
    mounted() {
      this.$nextTick(function() {
        console.log('hey')
        this.checked = this.getlocalServersList()
      })
    },
    methods: {
      updateServer(id,servername,value){
        let storedSettings = this.$store.getters.getSettingBLOCKEDSERVERS || {}
        if (storedSettings[id]){
          // Server already exists in settings
          storedSettings[id].enabled = value
        } else {
          storedSettings[id] = {
            enabled: value,
            name: servername,
            id: id,
            source: 'setting'
          }
        }
        this.$store.commit('setSettingBLOCKEDSERVERS', storedSettings)
      },
      getlocalServersList () {
        let servers = []
        if (this.$store.getters.getSettingBLOCKEDSERVERS) {
          for (let i in this.$store.getters.getSettingBLOCKEDSERVERS){
            servers.push(this.$store.getters.getSettingBLOCKEDSERVERS[i])
          }
        }
        console.log(this.$store.state.plex)
        this.$store.state.plex.servers.forEach((server) => {
          if (this.$store.getters.getSettingBLOCKEDSERVERS && this.$store.getters.getSettingBLOCKEDSERVERS[server.clientIdentifier]){
            return
          }
          servers.push({
            name: server.name,
            id: server.clientIdentifier,
            enabled: true,
            source: 'api'
          })
        })
        return servers
      }
    },
    watch: {
      plex: () => {
        console.log('Change')
        setTimeout(() => {
        },25)
      }
    },
    computed: {
      plex: function () {
        return this.$store.state.plex
      },
      context: function () {
        return this.$store
      },
      logo: function () {
        return 'static/plexlogo.png'
      },
      checked: {
        get () {
          let servers = []
          if (this.$store.getters.getSettingBLOCKEDSERVERS) {
            for (let i in this.$store.getters.getSettingBLOCKEDSERVERS){
              servers.push(this.$store.getters.getSettingBLOCKEDSERVERS[i])
            }
          }
          this.$store.state.plex.servers.forEach((server) => {
            if (this.$store.getters.getSettingBLOCKEDSERVERS && this.$store.getters.getSettingBLOCKEDSERVERS[server.clientIdentifier]){
              return
            }
            servers.push({
              name: server.name,
              id: server.clientIdentifier,
              enabled: true,
              source: 'api'
            })
          })
          return servers
        },
        set (newsettings) {
          console.log(newsettings)
          let storedSettings = this.$store.getters.getSettingBLOCKEDSERVERS || {}
          if (storedSettings[id]){
            // Server already exists in settings
            storedSettings[id].enabled = value
          } else {
            storedSettings[id] = {
              enabled: value,
              name: servername,
              id: id,
              source: 'setting'
            }
          }
          //this.$store.commit('setSettingBLOCKEDSERVERS', storedSettings)
        }
      },
    },
  }
</script>
