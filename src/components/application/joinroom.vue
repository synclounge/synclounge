<template> 
  <div>
    <v-layout row wrap justify-center>
      <v-flex xs12 lg8 xl6 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
        <v-layout row wrap justify-center>
          <v-flex xs12 md8 lg4 xl6>
            <img style="width:100%" v-bind:src="logo">
          </v-flex>
        </v-layout>
        <v-stepper style="background: rgba(0,0,0,0.3)" v-model="e1" light class="mb-4">
          <v-stepper-header>
            <v-stepper-step step="1" :complete="true">Select a client</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="2" :complete="false">Join a room</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="3">Sync</v-stepper-step>
          </v-stepper-header>
        </v-stepper>
      </v-flex>
    </v-layout> 
    <v-layout row wrap justify-center>
      <v-flex xs10 lg8 xl6>
        <h3 class="text-xs-center">Connect to a SyncLounge room</h3>
      </v-flex>
    </v-layout>
    <v-layout row wrap justify-center>
      <v-flex xs10 lg8 xl6>
        <p class="pa-2">
          It's time to connect to SyncLounge. From the list select a server which is closest to your location. Once you've chosen one that works for you it's time to create a room for your friends to join.
        </p>
      </v-flex>
    </v-layout>
    <v-layout row wrap justify-center>
      <v-flex xs10 lg8 xl6 v-if="!context.getters.getConnected" style="color:white !important">
        <v-select
          v-bind:items="ptservers"
          class="input-group--focused pt-input"
          style="mt-4"
          v-model="selectedServer"
          transition="v-scale-transition" origin="center center"
          max-height="auto"
          label="Select a server"
          append-icon="arrow_drop_up"
        ></v-select> 
        <v-text-field
          v-if="selectedServer == 'custom'"
          name="input-2"
          label="Custom Server"
          v-model="CUSTOMSERVER"
          class="input-group pt-input"
        ></v-text-field>
        <v-layout row wrap v-if="selectedServer == 'custom'">
          <v-flex xs4 offset-xs4>
            <v-btn class="pt-orange white--text pa-0 ma-0" primary style="width:100%" v-on:click.native="attemptConnectCustom()">Connect</v-btn>
          </v-flex>  
        </v-layout>       
        <v-layout row wrap v-if="connectionPending">
          <v-flex xs4 offset-xs4 center>          
            <div style="width:100%;text-align:center">				
              <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
            </div>
          </v-flex>  
        </v-layout>       
        <v-layout class="pt-3" row wrap v-if="serverError">
          <v-flex xs12 class="red--text">          
            <v-icon class="red--text">info</v-icon> {{ serverError }}   
          </v-flex>  
        </v-layout> 
      </v-flex>     
    </v-layout>
    <v-layout row wrap justify-center>
      <v-flex xs10 lg8 xl6 v-if="context.getters.getConnected">
        <v-layout row wrap>
          <v-flex xs12>          
            <v-text-field
              transition="v-scale-transition" origin="center center"
              :maxlength="25"
              name="input-2"
              label="Room name"
              :autofocus="true"
              v-on:keyup.enter.native="joinRoom()"
              v-model="room"            
            ></v-text-field>
          </v-flex>  
          <v-flex xs12>          
            <v-text-field
              transition="v-scale-transition" origin="center center"
              name="input-2"
              label="Room password"
              v-on:keyup.enter.native="joinRoom()"
              v-model="password"            
            ></v-text-field>
          </v-flex>        
          <v-flex xs4 offset-xs4>
            <v-btn block color="primary" v-on:click.native="joinRoom()">Join</v-btn>
          </v-flex>  
          <v-layout class="pt-3" row wrap v-if="roomError">
            <v-flex xs12 class="red--text">          
              <v-icon class="red--text">info</v-icon> {{ roomError }}   
            </v-flex>  
          </v-layout>   
        </v-layout>       
      </v-flex> 
    </v-layout>
  </div>
</template>

<script>
export default {
  props: ["object"],
  name: "joinroom",
  data() {
    return {
      selectedServer: "",
      serverError: null,
      roomError: null,
      room: "",
      e1: 2,
      password: "",
      connectionPending: false,
      thisServer: window.location.origin,

      ptservers: [
        {
          text: "SyncLounge AU1",
          value: "https://au1.synclounge.tv"
        },
        {
          text: "SyncLounge US1",
          value: "https://us1.synclounge.tv"
        },
        {
          text: "SyncLounge US2",
          value: "https://us2.synclounge.tv"
        },
        {
          text: "SyncLounge EU1",
          value: "https://eu1.synclounge.tv"
        },
        {
          text: "Custom Server",
          value: "custom"
        }
      ]
    };
  },
  created: function() {
    if (this.slRoom && this.slConnected && this.slServer) {
      this.$router.push("/browse");
    }
  },
  methods: {
    attemptConnect: function() {
      // Attempt the connection
      this.serverError = null;
      if (this.selectedServer != "custom") {
        this.$store
          .dispatch("socketConnect", { address: this.selectedServer })
          .then(result => {
            this.connectionPending = false;
            if (result) {
              this.serverError = "Failed to connect to " + this.selectedServer;
            } else {
              this.serverError = null;
            }
          })
          .catch(() => {
            this.serverError = "Failed to connect to " + this.selectedServer;
          });
      }
      return;
    },
    attemptConnectCustom: function() {
      this.connectionPending = true;
      this.serverError = null;
      this.$store
        .dispatch("socketConnect", { address: this.CUSTOMSERVER })
        .then(result => {
          this.connectionPending = false;
          if (result) {
            this.serverError = "Failed to connect to " + this.CUSTOMSERVER;
          } else {
            this.serverError = null;
          }
        })
        .catch(() => {
          this.serverError = "Failed to connect to " + this.CUSTOMSERVER;
        });
    },
    joinRoom: function() {
      if (!this.context.getters.getConnected) {
        return;
      }
      if (this.room == "" || this.room == null) {
        this.roomError = "You must enter a room name!";
        return;
      }
      let temporaryObj = {
        user: this.plex.user,
        roomName: this.room.toLowerCase(),
        password: this.password
      };
      this.$store
        .dispatch("joinRoom", temporaryObj)
        .then(() => {})
        .catch(e => {
          this.roomError = e;
        });
    }
  },
  watch: {
    selectedServer: function() {
      this.attemptConnect();
      this.serverError = null;
    },
    slRoom: function() {
      if (this.slServer && this.slRoom) {
        this.$router.push("/browse");
      }
    }
  },
  computed: {
    plex: function() {
      return this.$store.state.plex;
    },
    logo: function() {
      return this.logos.light.long;
    },
    context: function() {
      return this.$store;
    },
    CUSTOMSERVER: {
      get() {
        if (!this.$store.getters.getSettingCUSTOMSERVER) {
          return "http://";
        }
        return this.$store.getters.getSettingCUSTOMSERVER;
      },
      set(value) {
        this.$store.commit("setSettingCUSTOMSERVER", value);
      }
    }
  }
};
</script>

