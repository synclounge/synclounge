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
      <v-switch
        label="Enabled"
        hint="If enabled SyncLounge will attempt to automatically play the same content as the host."
        v-model="autoplay"
      ></v-switch>
    </div>
    <div style="text-align:center" class="pt-4">
      <h4 style="text-align:initial">SLPlayer Force Transcode</h4>
        <v-switch
          label="Enabled"
          v-model="SLPLAYERFORCETRANSCODE"
        ></v-switch>
      <small>WARNING: EXPERIMENTAL SETTING! DO NOT CHANGE IF YOU DO NOT UNDERSTAND THE RAMIFICATIONS.</small>
    </div>
  </div>
</template>

<script>
export default {
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
    SLPLAYERFORCETRANSCODE: {
      get () {
        return JSON.parse(this.$store.getters.getSettings['SLPLAYERFORCETRANSCODE'])
      },
      set (value) {
        this.$store.commit('setSetting', ['SLPLAYERFORCETRANSCODE', value])
      }
    },
    autoplay: {
      get () {
        return this.$store.getters.getSettings['AUTOPLAY']
      },
      set (value) {
        this.$store.commit('setSetting', ['AUTOPLAY', value])
      }
    },
    syncmode: {
      get () {
        return this.$store.getters.getSettings['SYNCMODE']
      },
      set (value) {
        this.$store.commit('setSetting', ['SYNCMODE', value])
      }
    },
    syncflexability: {
      get () {
        return this.$store.getters.getSettings['SYNCFLEXABILITY']
      },
      set (value) {
        this.$store.commit('setSetting', ['SYNCFLEXABILITY', value])
      }
    },
    clientpollinterval: {
      get () {
        return this.$store.getters.getSettings['CLIENTPOLLINTERVAL']
      },
      set (value) {
        this.$store.commit('setSetting', ['CLIENTPOLLINTERVAL', value])
      }
    }
  },
  mounted: function () {
    // Create event listeners
  }
}
</script>
