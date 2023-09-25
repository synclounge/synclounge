<template>
  <v-dialog max-width="400">
    <template #activator="stuff">
      <slot
        v-bind="stuff"
      />
    </template>

    <v-card>
      <v-list>
        <v-subheader>Web Player</v-subheader>

        <v-list-item
          three-line
          @click="SET_AUTO_SKIP_INTRO(!GET_AUTO_SKIP_INTRO)"
        >
          <v-list-item-content>
            <v-list-item-title>Auto Skip Intro</v-list-item-title>
            <v-list-item-subtitle>
              Automatically skip the intros of media when available
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="GET_AUTO_SKIP_INTRO"
              @change="SET_AUTO_SKIP_INTRO"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          three-line
          @click="SET_ALLOW_DIRECT_PLAY(!allowDirectPlay)"
        >
          <v-list-item-content>
            <v-list-item-title>Allow Direct Play</v-list-item-title>
            <v-list-item-subtitle>
              Allow direct play when available
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="allowDirectPlay"
              @change="SET_ALLOW_DIRECT_PLAY"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          three-line
          @click="SET_SLPLAYERFORCETRANSCODE(!GET_SLPLAYERFORCETRANSCODE)"
        >
          <v-list-item-content>
            <v-list-item-title>Force Transcode</v-list-item-title>
            <v-list-item-subtitle>
              Force Plex to transcode all media and never direct play or stream
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="GET_SLPLAYERFORCETRANSCODE"
              @change="SET_SLPLAYERFORCETRANSCODE"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          three-line
          @click="SET_FORCE_BURN_SUBTITLES(!forceBurnSubtitles)"
        >
          <v-list-item-content>
            <v-list-item-title>Force Burn Subtitles</v-list-item-title>
            <v-list-item-subtitle>
              Force Plex to burn all subtitles.
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="forceBurnSubtitles"
              @change="SET_FORCE_BURN_SUBTITLES"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item @click="streamingProtocolSelectOpen = !streamingProtocolSelectOpen">
          <v-list-item-content>
            <v-list-item-title>Streaming Protocol</v-list-item-title>

            <v-select
              :menu-props="{ value: streamingProtocolSelectOpen }"
              dense
              hide-details
              :value="GET_STREAMING_PROTOCOL"
              :items="streamingProtocols"
              :rules="[v => !!v || 'Item is required']"
              required
              @blur="streamingProtocolSelectOpen = false"
              @input="SET_STREAMING_PROTOCOL($event); streamingProtocolSelectOpen = false"
            >
              <template #selection="{ item }">
                <span class="text-body-2 text--secondary">
                  {{ item }}
                </span>
              </template>
            </v-select>
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <v-subheader>Chat</v-subheader>

        <v-list-item
          three-line
          @click="isSecureContext ? CHANGE_NOTIFICATIONS_ENABLED(!ARE_NOTIFICATIONS_ENABLED) : null"
        >
          <v-list-item-content>
            <v-list-item-title>Desktop Notifications</v-list-item-title>
            <v-list-item-subtitle>
              Display desktop notifications when a new message is received
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="ARE_NOTIFICATIONS_ENABLED && isSecureContext"
              :disabled="!isSecureContext"
              @change="CHANGE_NOTIFICATIONS_ENABLED"
              @click.stop
            />

            <v-tooltip
              v-if="!isSecureContext"
              bottom
            >
              <template #activator="{ on, attrs }">
                <v-icon
                  color="warning"
                  class="mr-4 mt-1"
                  v-bind="attrs"
                  v-on="on"
                >
                  info
                </v-icon>
              </template>

              <span>
                Desktop notifications are only available in secure contexts (HTTPS)
              </span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          three-line
          @click="SET_ARE_SOUND_NOTIFICATIONS_ENABLED(!ARE_SOUND_NOTIFICATIONS_ENABLED)"
        >
          <v-list-item-content>
            <v-list-item-title>Sound Notifications</v-list-item-title>
            <v-list-item-subtitle>
              Play a sound when a new message is received
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="ARE_SOUND_NOTIFICATIONS_ENABLED"
              @change="SET_ARE_SOUND_NOTIFICATIONS_ENABLED"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          three-line
        >
          <v-list-item-content>
            <v-list-item-title>Display Name</v-list-item-title>
            <v-list-item-subtitle>
              Your username in chat
            </v-list-item-subtitle>

            <v-text-field
              dense
              hide-details
              class="text-body-2 text--secondary"
              :value="GET_ALTUSERNAME"
              :placeholder="username"
              @change="SET_ALTUSERNAME"
            />
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <v-subheader>Synchronization</v-subheader>

        <v-list-item
          three-line
          @click="SET_AUTOPLAY(!GET_AUTOPLAY)"
        >
          <v-list-item-content>
            <v-list-item-title>Autoplay</v-list-item-title>
            <v-list-item-subtitle>
              Automatically play the same content as the host
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-switch
              hide-details
              :input-value="GET_AUTOPLAY"
              @change="SET_AUTOPLAY"
              @click.stop
            />
          </v-list-item-action>
        </v-list-item>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Sync Flexibility</v-list-item-title>
            <v-list-item-subtitle>
              Time difference threshold for synchronization
            </v-list-item-subtitle>

            <v-slider
              hide-details
              :value="GET_SYNCFLEXIBILITY"
              :min="0"
              :max="10000"
              thumb-label
              @change="UPDATE_SYNC_FLEXIBILITY"
            />
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="syncModeSelectOpen = !syncModeSelectOpen">
          <v-list-item-content>
            <v-list-item-title>Syncing Method</v-list-item-title>

            <v-select
              :menu-props="{ value: syncModeSelectOpen }"
              dense
              hide-details
              :value="GET_SYNCMODE"
              :items="syncMethods"
              :rules="[v => !!v || 'Item is required']"
              required
              @blur="syncModeSelectOpen = false"
              @input="SET_SYNCMODE($event); syncModeSelectOpen = false"
            >
              <template #selection="{ item }">
                <span class="text-body-2 text--secondary">
                  {{ item.text }}
                </span>
              </template>
            </v-select>
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <v-subheader>Plex</v-subheader>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Client Poll Interval</v-list-item-title>
            <v-list-item-subtitle>
              How often Plex clients are polled for new information
            </v-list-item-subtitle>

            <v-slider
              hide-details
              :value="GET_CLIENTPOLLINTERVAL"
              :min="100"
              :max="10000"
              thumb-label
              @change="SET_CLIENTPOLLINTERVAL"
            />
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          three-line
          @click="blockedServersSelectOpen = !blockedServersSelectOpen"
        >
          <v-list-item-content>
            <v-list-item-title>Blocked Servers</v-list-item-title>

            <v-list-item-subtitle>
              Prevent searching certain servers when attempting to autoplay content
            </v-list-item-subtitle>

            <v-select
              v-model="BLOCKEDSERVERS"
              :menu-props="{ value: blockedServersSelectOpen }"
              dense
              hide-details
              multiple
              placeholder="None"
              :items="localServersList"
              item-value="id"
              item-text="name"
              @blur="blockedServersSelectOpen = false"
            >
              <template #selection="{ item }">
                <v-chip
                  small
                  class="text-body-2 text--secondary"
                >
                  <span>{{ item.name }}</span>
                </v-chip>
              </template>
            </v-select>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script>
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import { streamingProtocols } from '@/utils/streamingprotocols';

export default {
  name: 'TheSettingsDialog',

  data: () => ({
    streamingProtocolSelectOpen: false,
    syncModeSelectOpen: false,
    blockedServersSelectOpen: false,
    syncMethods: [
      { text: 'Clean Seek', value: 'cleanseek' },
      { text: 'Skip Ahead', value: 'skipahead' },
    ],

    streamingProtocols,
  }),

  computed: {
    ...mapGetters('settings', [
      'GET_AUTOPLAY',
      'GET_SLPLAYERFORCETRANSCODE',
      'GET_CLIENTPOLLINTERVAL',
      'GET_SYNCFLEXIBILITY',
      'GET_SYNCMODE',
      'GET_AUTO_SKIP_INTRO',
      'GET_ALTUSERNAME',
    ]),

    ...mapGetters('slplayer', [
      'GET_STREAMING_PROTOCOL',
    ]),

    ...mapGetters('synclounge', [
      'ARE_NOTIFICATIONS_ENABLED',
      'ARE_SOUND_NOTIFICATIONS_ENABLED',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVERS',
      'GET_BLOCKED_SERVER_IDS',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_USER',
    ]),

    ...mapState('slplayer', [
      'forceBurnSubtitles',
      'allowDirectPlay',
    ]),

    username() {
      return this.GET_PLEX_USER?.username;
    },

    isSecureContext() {
      return window.isSecureContext;
    },

    BLOCKEDSERVERS: {
      get() {
        return this.GET_BLOCKED_SERVER_IDS;
      },

      set(value) {
        this.SET_BLOCKED_SERVER_IDS(value);
      },
    },

    localServersList() {
      return this.GET_PLEX_SERVERS.map((server) => ({
        name: server.name,
        id: server.clientIdentifier,
      }));
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
      // TODO: potentially add system for announcing username changes
      'SET_ALTUSERNAME',
    ]),

    ...mapMutations('slplayer', [
      'SET_STREAMING_PROTOCOL',
      'SET_FORCE_BURN_SUBTITLES',
      'SET_ALLOW_DIRECT_PLAY',
    ]),

    ...mapMutations('synclounge', [
      'SET_ARE_SOUND_NOTIFICATIONS_ENABLED',
    ]),

    ...mapMutations('plexservers', [
      'SET_BLOCKED_SERVER_IDS',
    ]),
  },
};
</script>
