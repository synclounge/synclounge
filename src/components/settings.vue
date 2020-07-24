<template>
  <div>
    <div style="text-align:center">
      <h4 style="text-align:initial">
        Plex Client Polling Interval
      </h4>

      <div> {{ GET_CLIENTPOLLINTERVAL }} </div>

      <v-slider
        class="pa-0 ma-0"
        :value="GET_CLIENTPOLLINTERVAL"
        :min="100"
        :max="10000"
        hint="Sets how frequently SyncLounge will poll plex clients for new information in
        milliseconds.Default is 1000ms (1 second)"
        persistent-hint
        @change="SET_CLIENTPOLLINTERVAL"
      />
    </div>

    <v-divider />

    <div
      style="text-align:center"
      class="pt-4"
    >
      <h4 style="text-align:initial">
        Sync Flexibility
      </h4>

      <div> {{ GET_SYNCFLEXIBILITY }} </div>

      <v-slider
        class="pa-0 ma-0"
        :value="GET_SYNCFLEXIBILITY"
        :min="0"
        :max="10000"
        hint="Sets the acceptable distance away from the host in milliseconds.
        Default is 3000ms (3 seconds)."
        persistent-hint
        @change="SET_SYNCFLEXIBILITY"
      />
    </div>

    <v-divider />

    <div
      style="text-align:center"
      class="pt-4"
    >
      <h4 style="text-align:initial">
        Syncing Method
      </h4>

      <v-radio-group v-model="syncmode">
        <v-radio
          label="Clean Seek"
          class="pa-0 ma-0"
          value="cleanseek"
        />

        <v-radio
          label="Skip Ahead"
          class="pa-0 ma-0"
          value="skipahead"
          persistent-hint
          hint="Sets the syncing method used when we need to get back in line with the host."
        />
      </v-radio-group>
    </div>

    <div
      style="text-align:center"
      class="pt-4"
    >
      <h4 style="text-align:initial">
        Autoplay
      </h4>

      <v-switch
        label="Enabled"
        hint="If enabled SyncLounge will attempt to automatically play the
         same content as the host."
        :input-value="GET_AUTOPLAY"
        @change="SET_AUTOPLAY"
      />
    </div>

    <div
      style="text-align:center"
      class="pt-4"
    >
      <h4 style="text-align:initial">
        SLPlayer Force Transcode
      </h4>

      <v-switch
        label="Enabled"
        :input-value="GET_SLPLAYERFORCETRANSCODE"
        @change="SET_SLPLAYERFORCETRANSCODE"
      />
    </div>

    <small>
      WARNING: EXPERIMENTAL SETTING! DO NOT CHANGE IF YOU DO NOT UNDERSTAND THE RAMIFICATIONS.
    </small>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'Settings',
  computed: {
    ...mapGetters('settings', [
      'GET_AUTOPLAY',
      'GET_SLPLAYERFORCETRANSCODE',
      'GET_CLIENTPOLLINTERVAL',
      'GET_SYNCFLEXIBILITY',
      'GET_SYNCMODE',
    ]),

    syncmode: {
      get() {
        return this.GET_SYNCMODE;
      },

      set(value) {
        this.SET_SYNCMODE(value);
      },
    },
  },

  methods: {
    ...mapMutations('settings', [
      'SET_AUTOPLAY',
      'SET_SLPLAYERFORCETRANSCODE',
      'SET_CLIENTPOLLINTERVAL',
      'SET_SYNCFLEXIBILITY',
      'SET_SYNCMODE',
    ]),
  },
};
</script>
