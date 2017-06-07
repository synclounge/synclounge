<template>
  <div class="container" style="padding: 10px; font-family:'Open Sans', sans-serif !important;">
    <div class="row">
      <div class="col s12">
        <div class="col s2 offset-s3">
          <img style="width:100%;height:auto" v-bind:src="logo"/>
        </div>
        <div class="col s4">
          <h3 style="">Plex Settings</h3>
        </div>
      </div>
    </div>
    <div class="row valign-wrapper" style="margin-bottom: 0;">
      <div class="col l2 s1 valign">
        <h4><i class="material-icons"
               title="Used for autoplay functionality. Use this list to block PlexTogether from searching certain servers when attempting to autoplay content.">info_outline</i>
        </h4>
      </div>
      <div class="col l5 s11 valign">
        <h4 style="padding-bottom: 10px; text-align: left;">Autoplay Plex Servers</h4>
      </div>
      <div class="col l5 s12 valign" v-if="plex && plex.gotDevices && plex.servers && localServersList.length > 0" >
        <div class="row blockedServers" v-for="server in localServersList">
          <div class="col s8 truncate">{{ server.name }}</div>
          <div class="col s4">
            <v-switch
              :checked="server.enabled"
              :on="''"
              :off="''"
              v-on:input="updateServer(server.id,server.name,$event)"
            ></v-switch>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['object'],
    name: 'plexsettings',
    data () {
      return {
        checked: {}
      }
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
      }
    },
    computed: {
      plex: function () {
        return this.$store.state.plex
      },
      context: function () {
        return this.$store
      },
      localServersList () {
        let servers = []
        if (this.$store.getters.getSettingBLOCKEDSERVERS) {
          for (let i in this.$store.getters.getSettingBLOCKEDSERVERS){
            servers.push(this.$store.getters.getSettingBLOCKEDSERVERS[i])
          }
        }
        if (!this.plex || !this.plex.servers){
          return servers
        }
        this.plex.servers.forEach((server) => {
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
      syncmode: {
        get () {
          return this.$store.getters.getSettingSYNCMODE
        },
        set (value) {
          this.$store.commit('setSettingSYNCMODE', value)
        }
      },
      logo: function () {
        return 'static/plexlogo.png'
      },
    },
    mounted: function () {
      // Create event listeners
    }
  }
</script>
