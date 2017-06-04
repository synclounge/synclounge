<template>
  <div v-if="chosenClient && plex" class="col l2 s12" v-bind:style="{ position: isMobile }"
       style="border-right-color: rgba(0,0,0,0.1); border-right-width: 1px; border-right-style: solid; border-bottom-color: rgba(0,0,0,0.1); border-bottom-width: 1px; border-bottom-style: solid; width: 100% min-height: 50%;">
    <div style="overflow-y: auto;max-height: 50%;">
      <div class="mdc-list">
        <li v-if="chosenClient" class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text truncate"
            href="#">
          Plex Players {{playercount}}
        </li>
        <li v-if="plex && chosenClient" v-for="client in clients" id="plexPlayers">
          <plexclient :sidebar="true" :object="client"></plexclient>
        </li>
      </div>
      <div v-if="ptConnected" style="margin-bottom: 20px">
        <div class="mdc-list">
          <li class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text" href="#">
            PT Server
          </li>
          <li class="mdc-list-item truncate" style="height: 30px" id="plexTogetherServerAddress">
            {{ ptServer }}
          </li>
        </div>
        <div class="mdc-list">
          <li class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text" href="#">
            PT Room
          </li>
          <li class="mdc-list-item truncate" style="height: 30px" id="plexTogetherRoomName">
            {{ ptRoom }}
          </li>
        </div>
        <div v-if="ptPassword" class="mdc-list">
          <li class="mdc-list-item mdc-permanent-drawer--selected plex-gamboge-text" href="#">
            PT Password
          </li>
          <li class="mdc-list-item truncate" style="height: 30px" id="plexTogetherRoomPassword">
            {{ ptPassword }}
          </li>
        </div>
      </div>
    </div>
    <div class="row" style="position: absolute;left: 0; margin-bottom: 0; width:100%" v-bind:style="mobileStyle">
      <div v-if="plex && chosenClient" class="plexTogetherInfo col l12 s12"
           style="padding-top: 11.25px; min-height:30%; max-height:50%; padding-left: 0; padding-right: 0">
        <div class="row" v-if="chosenClient.clientPlayingMetadata" style="margin-bottom: 0;" id="userMetadata">
          <div class="col s12 center">
            <img id="metaThumb" :src="metadataThumb" style="max-height: 30%; max-width: 100%">
          </div>
          <div class="col s12 center white-text" id="metaUnder" style="padding-bottom: 10px;">
            {{ metadataTitle }}
            <br> {{ metadataInfo }}
            <br> <label>Playing on {{ metadataServer }}</label>
          </div>
        </div>
        <div v-if="ptConnected" class="col s12" style="padding:0">
          <button class="mdc-button mdc-button--raised mdc-button--accent plex-gamboge ptSettings disconnect"
                  id="plexTogetherLeaveButton" style="width: 100%;" v-on:click="handleDisconnect()">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

  import plexclient from './plexclient'
  import plexserver from './plexserver'

  export default {
    props: ['object', 'mobile'],
    name: 'sidebar',
    data () {
      return {
        testClient: null
      }
    },
    components: {
      plexclient,
      plexserver,
    },
    computed: {
      mobileStyle: function () {
        if (!this.mobile) {
          return {
            bottom: '0px'
          }
        }
        return {}
      },
      chosenClient: function () {
        return this.$store.getters.getChosenClient
      },
      plex: function () {
        return this.$store.getters.getPlex
      },
      clients: function () {
        return this.$store.getters.getPlex.clients
      },
      context: function () {
        return this.$store
      },
      logo: function () {
        if (this.$store.getters.getSettingDARKMODE) {
          return 'static/logo-long-light.png'
        }
        return 'static/logo-long-dark.png'
      },
      ptConnected: function () {
        return this.$store.getters.getConnected
      },
      ptServer: function () {
        return this.$store.getters.getServer
      },
      ptRoom: function () {
        return this.$store.getters.getRoom
      },
      ptPassword: function () {
        return this.$store.getters.getPassword
      },
      validPlex: function () {
        if (!this.$store.state.plex) {
          return false
        }
        return true
      },
      playercount: function () {
        if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
          return '(' + this.$store.state.plex.clients.length + ')'
        }
        return ''
      },
      servercount: function () {
        if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
          return '(' + this.$store.state.plex.servers.length + ')'
        }
        return ''
      },
      metadataThumb: function () {
        if (!this.validPlex) {
          return ''
        }
        let plexObj = this.$store.state.plex
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        let server;
        let content = metadata.thumb;
        if (metadata.parentThumb) {
          content = metadata.parentThumb
        }
        if (!plexObj.getServerById(metadata.machineIdentifier)) {
          return ''
        }
        return plexObj.getServerById(metadata.machineIdentifier).getUrlForLibraryLoc(content)
      },
      metadataServer: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        return (this.plex.getServerById(this.chosenClient.clientPlayingMetadata.machineIdentifier).name)
      },
      metadataTitle: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        if (metadata.type == 'movie') {
          return metadata.title
        }
        if (metadata.type == 'episode') {
          return metadata.grandparentTitle
        }
        return metadata.index
      },
      metadataInfo: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        if (metadata.type == 'movie') {
          return metadata.year
        }
        if (metadata.type == 'episode') {
          return metadata.title + ' (S' + metadata.parentIndex + '·E' + metadata.index + ')'
        }
        return metadata.index

      },
      isMobile: function () {
        if (!this.mobile) {
          return 'relative'
        }
        return ''
      },
    },
    methods: {
      previewClient: function (client) {
        this.testClient = client
      },
      clientClicked: function (client) {
        let clients = this.$store.getters.getPlex.clients
        for (let i = 0; i < clients.length; i++) {
          let _client = clients[i]
          _client.connectedstatus = 'fresh'
        }
        //this.$store.state.plex.chosenClient = null
        client.connectedstatus = 'waiting'
        let that = this
        client.findConnection(function (res) {
          let plexObj = that.$store.state.plex
          if (res) {
            client.connectedstatus = 'connected'
            that.$store.commit('SET_CHOSENCLIENT', client)

          } else {
            client.connectedstatus = 'failed'
          }
        })
      },
      handleDisconnect: function () {
        this.$store.dispatch('disconnectServer')
      },
      openJoinRoomModal: function () {
        return this.$parent.$refs.joinroomModal.open()
      },
    }
  }
</script>

