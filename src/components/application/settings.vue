<template>
  <div>
    <div style="text-align:center">
      <h6 style="text-align:initial">Plex Client Polling Interval</h6>
      <div> {{ clientpollinterval }}</div>
      <v-slider class="pa-0 ma-0" v-model="clientpollinterval" :min="100" :max="10000"
            hint="Sets how frequently Plex Together will poll the client for new information in milliseconds. Default is 5000ms (5 seconds)" 
            light
            persistent-hint>
      </v-slider>
    </div>    
    <v-divider></v-divider>
    <div style="text-align:center" class="pt-4">
      <h6 style="text-align:initial">Sync Flexibility</h6>
      <div> {{ syncflexability }}</div>
      <v-slider class="pa-0 ma-0" v-model="syncflexability" :min="500" :max="10000"
            hint="Sets the acceptable distance away from the host in milliseconds. Default is 3000ms (3 seconds)." 
            light
            persistent-hint>
      </v-slider>
    </div>
    <v-divider></v-divider>
    <div style="text-align:center" class="pt-4">
      <h6 style="text-align:initial">Syncing Method</h6>
      <v-radio label="Clean Seek" class="pa-0 ma-0" v-model="syncmode" value="cleanseek" light></v-radio>
      <v-radio label="Skip Ahead" class="pa-0 ma-0"  v-model="syncmode" value="skipahead" 
      persistent-hint
      hint="Sets the syncing method used when we need to get back in line with the host."
      
      light></v-radio>
    </div>
  </div>
</template>

<script>

  export default {
    props: ['object'],
    name: 'settings',
    data () {
      return {}
    },
    methods: {
      //this.$store.dispatch('function',params)

    },
    computed: {
      plex: function () {
        return this.$store.state.plex
      },
      context: function () {
        return this.$store
      },
      logo: function () {
        return 'static/logo-small-light.png'
      },
      appVersion () {
        return this.$store.state.appVersion
      },
      syncmode: {
        get () {
          return this.$store.getters.getSettingSYNCMODE
        },
        set (value) {
          this.$store.commit('setSettingSYNCMODE', value)
        }
      },
      syncflexability: {
        get () {
          return this.$store.getters.getSettingSYNCFLEXABILITY
        },
        set (value) {
          this.$store.commit('setSettingSYNCFLEXABILITY', value)
        }
      },
      clientpollinterval: {
        get () {
          return this.$store.getters.getSettingCLIENTPOLLINTERVAL
        },
        set (value) {
          this.$store.commit('setSettingCLIENTPOLLINTERVAL', value)
        }
      }
    },
    mounted: function () {
      // Create event listeners
    }
  }
</script>

