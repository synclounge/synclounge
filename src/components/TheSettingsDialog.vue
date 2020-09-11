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
            label="Autoplay"
            :input-value="GET_AUTOPLAY"
            class="pa-0 ma-0"
            @change="SET_AUTOPLAY"
          />

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-list-item-icon
                v-bind="attrs"
                class="mt-0"
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
            label="Auto Skip Intro"
            :input-value="GET_AUTO_SKIP_INTRO"
            class="pa-0 ma-0"
            @change="SET_AUTO_SKIP_INTRO"
          />
        </v-list-item>

        <v-list-item>
          <v-switch
            label="Force Transcode"
            :input-value="GET_SLPLAYERFORCETRANSCODE"
            class="pa-0 ma-0"
            @change="SET_SLPLAYERFORCETRANSCODE"
          />
        </v-list-item>

        <v-subheader>Chat</v-subheader>

        <v-list-item>
          <v-switch
            label="Desktop Notifications"
            :input-value="ARE_NOTIFICATIONS_ENABLED && !isHttp"
            :disabled="isHttp"
            class="pa-0 ma-0"
            @change="CHANGE_NOTIFICATIONS_ENABLED"
          />

          <v-tooltip
            v-if="isHttp"
            bottom
          >
            <template #activator="{ on, attrs }">
              <v-list-item-icon
                v-bind="attrs"
                class="mt-0"
                v-on="on"
              >
                <v-icon>info</v-icon>
              </v-list-item-icon>
            </template>

            <span>
              Popup notifications are only available in secure contexts (HTTPS)
            </span>
          </v-tooltip>
        </v-list-item>

        <v-list-item>
          <v-switch
            label="Sound Notifications"
            :input-value="ARE_SOUND_NOTIFICATIONS_ENABLED"
            class="pa-0 ma-0"
            @change="SET_ARE_SOUND_NOTIFICATIONS_ENABLED"
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

    ...mapGetters('synclounge', [
      'ARE_NOTIFICATIONS_ENABLED',
      'ARE_SOUND_NOTIFICATIONS_ENABLED',
    ]),

    isHttp() {
      return window.location.protocol === 'http:';
    },
  },

  methods: {
    ...mapActions('synclounge', [
      'UPDATE_SYNC_FLEXIBILITY',
      'CHANGE_NOTIFICATIONS_ENABLED',
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

    ...mapMutations('synclounge', [
      'SET_ARE_SOUND_NOTIFICATIONS_ENABLED',
    ]),
  },
};
</script>
