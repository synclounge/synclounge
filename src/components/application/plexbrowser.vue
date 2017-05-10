<template>
    <div style="height:100%; width:100%; overflow-y:auto; padding:1%" class="row">
        <div v-if="!browsingServer" v-for="server in availableServers">
            <v-card v-on:click.native="setServer(server)" class="blue col s12 l3 hoverable" style="box-shadow:none">
                <div class="col s3 l3" style="height:100%">
                    <img src="static/plexlogo.png" style="height:100%; width:100%" >
                </div>
                <div class="col s9 l9">
                    <div style="font-size: 1vw;">{{ server.name }}</div>
                    <label>
                     v{{ server.productVersion }}
                    </label>
                    <div> Owned by {{ ownerOfServer(server) }}</div>
                </div>
            </v-card>
        </div>
        <plexserver v-if="browsingServer" :server="browsingServer">
        </plexserver>
    </div>
</template>

<script>
import plexserver from './plexbrowser/plexserver'
export default {
    props: ['plexbrowser'],
    components: {
        plexserver
    },
    name: 'plexbrowser',
    methods: {
        setServer(server){
            this.browsingServer = server
        },
        ownerOfServer(server){
            if (server.owned == '1'){
                return 'you'
            } else {
                return server.sourceTitle
            }
        },
    },    
    data() {
      return {
          browsingServer: null
      }
    },
    computed: {
        plex(){
            return this.$store.getters.getPlex
        },
        availableServers(){
            let servers = this.plex.servers.filter(function(server){
                if (server.chosenConnection){
                    return true
                }
                return false
            })
            return servers
        }
    }
}
</script>

