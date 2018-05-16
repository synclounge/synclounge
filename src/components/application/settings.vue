<template>
  <div>
    <div style="text-align:center">
      <h4 style="text-align:initial">Plex Client Polling Interval</h4>
      <div> {{ clientpollinterval }}</div>
      <v-slider class="pa-0 ma-0" v-model="clientpollinterval" :min="100" :max="10000"
        hint="Sets how frequently SyncLounge will poll the client for new information in milliseconds. Default is 5000ms (5 seconds)"
        persistent-hint>
      </v-slider>
    </div>
    <v-divider></v-divider>
    <div style="text-align:center" class="pt-4">
      <h4 style="text-align:initial">Sync Flexibility</h4>
      <div> {{ syncflexability }}</div>
      <v-slider class="pa-0 ma-0" v-model="syncflexability" :min="100" :max="10000"
        hint="Sets the acceptable distance away from the host in milliseconds. Default is 3000ms (3 seconds)."
        persistent-hint>
      </v-slider>
    </div>
    <v-divider></v-divider>
    <div style="text-align:center" class="pt-4">
      <h4 style="text-align:initial">Syncing Method</h4>
      <v-radio-group v-model="syncmode">
        <v-radio label="Clean Seek" class="pa-0 ma-0" value="cleanseek"></v-radio>
        <v-radio label="Skip Ahead" class="pa-0 ma-0"  value="skipahead"
        persistent-hint
        hint="Sets the syncing method used when we need to get back in line with the host."></v-radio>
      </v-radio-group>
    </div>
    <div style="text-align:center" class="pt-4">
      <h4 style="text-align:initial">Autoplay</h4>
      <div></div>
        <v-switch
          label="Enabled"
          hint="If enabled SyncLounge will attempt to automatically play the same content as the host."
          v-model="autoplay"
        ></v-switch>
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
    // this.$store.dispatch('function',params)
  },
  computed: {
    plex: function () {
      return this.$store.state.plex
    },
    context: function () {
      return this.$store
    },
    appVersion () {
      return this.$store.state.appVersion
    },
    autoplay: {
      get () {
        return this.$store.getters.getSettingAUTOPLAY
      },
      set (value) {
        this.$store.commit('setSettingAUTOPLAY', value)
      }
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
