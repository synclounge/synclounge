<template>
  <v-dialog max-width="350">
    <template #activator="stuff">
      <slot v-bind="stuff" />
    </template>

    <v-card>
      <v-card-title>SyncLounge Settings</v-card-title>

      <v-list dense>
        <v-list-item>
          <v-slider
            dense
            label="Client Poll Interval"
            :value="GET_CLIENTPOLLINTERVAL"
            :min="100"
            :max="10000"
            :thumb-label="true"
            @change="SET_CLIENTPOLLINTERVAL"
          />

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-list-item-icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>info</v-icon>
              </v-list-item-icon>
            </template>

            <span>
              How often Plex clients are polled for new information
            </span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-slider
            label="Sync Flexibility"
            :value="GET_SYNCFLEXIBILITY"
            :min="0"
            :max="10000"
            :thumb-label="true"
            @change="UPDATE_SYNC_FLEXIBILITY"
          />

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-list-item-icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>info</v-icon>
              </v-list-item-icon>
            </template>

            <span>
              Max allowed distance from host
            </span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-select
            :value="GET_STREAMING_PROTOCOL"
            :items="streamingProtocols"
            :rules="[v => !!v || 'Item is required']"
            label="Streaming Protocol"
            required
            @input="SET_STREAMING_PROTOCOL"
          />
        </v-list-item>

        <v-list-item>
          <v-select
            :value="GET_SYNCMODE"
            :items="syncMethods"
            :rules="[v => !!v || 'Item is required']"
            label="Syncing Method"
            required
            @input="SET_SYNCMODE"
          />
        </v-list-item>

        <v-list-item>
          <v-switch
            dense
            label="Autoplay"
            :input-value="GET_AUTOPLAY"
            @change="SET_AUTOPLAY"
          />

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-list-item-icon
                v-bind="attrs"
                class="align-self-center"
                v-on="on"
              >
                <v-icon>info</v-icon>
              </v-list-item-icon>
            </template>

            <span>
              Automatically play the same content as the host
            </span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-switch
            dense
            label="Auto Skip Intro"
            :input-value="GET_AUTO_SKIP_INTRO"
            @change="SET_AUTO_SKIP_INTRO"
          />
        </v-list-item>

        <v-list-item>
          <v-switch
            dense
            label="Force Transcode"
            :input-value="GET_SLPLAYERFORCETRANSCODE"
            @change="SET_SLPLAYERFORCETRANSCODE"
          />
        </v-list-item>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { streamingProtocols } from '@/utils/streamingprotocols';

export default {
  name: 'TheSettingsDialog',

  data() {
    return {
      syncMethods: [
        { text: 'Clean Seek', value: 'cleanseek' },
        { text: 'Skip Ahead', value: 'skipahead' },
      ],

      streamingProtocols,
    };
  },

  computed: {
    ...mapGetters('settings', [
      'GET_AUTOPLAY',
      'GET_SLPLAYERFORCETRANSCODE',
      'GET_CLIENTPOLLINTERVAL',
      'GET_SYNCFLEXIBILITY',
      'GET_SYNCMODE',
      'GET_AUTO_SKIP_INTRO',
    ]),

    ...mapGetters('slplayer', [
      'GET_STREAMING_PROTOCOL',
    ]),
  },

  methods: {
    ...mapActions('synclounge', [
      'UPDATE_SYNC_FLEXIBILITY',
    ]),

    ...mapMutations('settings', [
      'SET_AUTOPLAY',
      'SET_SLPLAYERFORCETRANSCODE',
      'SET_CLIENTPOLLINTERVAL',
      'SET_SYNCMODE',
      'SET_AUTO_SKIP_INTRO',
    ]),

    ...mapMutations('slplayer', [
      'SET_STREAMING_PROTOCOL',
    ]),
  },
};
</script>
