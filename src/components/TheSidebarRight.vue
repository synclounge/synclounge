<template>
  <v-navigation-drawer
    :value="isRightSidebarOpen"
    style="z-index: 6;"
    app
    right
    class="pa-0"
    width="300"
    @input="SET_RIGHT_SIDEBAR_OPEN"
  >
    <template #prepend>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-subtitle
            v-if="Object.keys(GET_USERS).length != 1"
            class="participant-count"
          >
            {{ Object.keys(GET_USERS).length }} people
          </v-list-item-subtitle>

          <v-list-item-subtitle
            v-else
            class="participant-count"
          >
            It's just you, invite some friends
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            icon
            @click="DISCONNECT_AND_NAVIGATE_HOME"
          >
            <v-icon>exit_to_app</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>

      <v-list-item dense>
        <v-switch
          v-if="AM_I_HOST"
          hide-details
          class="pa-0 ma-0"
          label="Party Pausing"
          :input-value="IS_PARTY_PAUSING_ENABLED"
          @change="SEND_SET_PARTY_PAUSING_ENABLED"
        />

        <v-list-item-content
          v-if="!AM_I_HOST && GET_HOST_USER.state === 'stopped'"
        >
          <v-list-item-subtitle>
            Waiting for {{ GET_HOST_USER ? GET_HOST_USER.username : 'host' }} to start
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-tooltip
        v-if="AM_I_HOST"
        bottom
      >
        <template #activator="{ on, attrs }">
          <v-list-item
            dense
            v-bind="attrs"
            v-on="on"
          >
            <v-switch
              class="pa-0 ma-0"
              hide-details
              label="Auto Host"
              :input-value="IS_AUTO_HOST_ENABLED"
              @change="SEND_SET_AUTO_HOST_ENABLED"
            />
          </v-list-item>
        </template>

        <span>Automatically transfers host to other users when they play something new</span>
      </v-tooltip>

      <v-list-item
        v-if="(!AM_I_HOST || usingPlexClient)
          && GET_HOST_USER && GET_HOST_USER.state !== 'stopped'"
        dense
      >
        <v-tooltip
          bottom
          color="rgb(44, 44, 49)"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              color="primary"
              :disabled="!IS_PARTY_PAUSING_ENABLED"
              v-on="on"
              @click="sendPartyPause(GET_HOST_USER.state === 'playing')"
            >
              <v-icon v-if="GET_HOST_USER.state === 'playing'">
                pause
              </v-icon>

              <v-icon v-else>
                play_arrow
              </v-icon>
            </v-btn>
          </template>

          <span>Party Pausing is currently {{
            IS_PARTY_PAUSING_ENABLED ? 'enabled' : 'disabled' }} by the host</span>
        </v-tooltip>
      </v-list-item>

      <v-divider />
    </template>

    <div
      style="height: 100%;"
      class="d-flex flex-column"
    >
      <UserList />
      <v-divider />

      <MessageList class="messages" />
    </div>

    <template #append>
      <MessageInput />
    </template>
  </v-navigation-drawer>
</template>

<script>
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';

import { slPlayerClientId } from '@/player/constants';

export default {
  name: 'TheSidebarRight',

  components: {
    MessageList: () => import('@/components/MessageList.vue'),
    MessageInput: () => import('@/components/MessageInput.vue'),
    UserList: () => import('@/components/UserList.vue'),
  },

  computed: {
    ...mapState(['isRightSidebarOpen']),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
    ]),

    ...mapGetters('synclounge', [
      'IS_PARTY_PAUSING_ENABLED',
      'IS_AUTO_HOST_ENABLED',
      'GET_USERS',
      'GET_HOST_USER',
      'AM_I_HOST',
    ]),

    usingPlexClient() {
      return this.GET_CHOSEN_CLIENT_ID !== slPlayerClientId;
    },
  },

  methods: {
    ...mapActions('synclounge', [
      'SEND_SET_PARTY_PAUSING_ENABLED',
      'SEND_SET_AUTO_HOST_ENABLED',
      'sendPartyPause',
      'DISCONNECT_AND_NAVIGATE_HOME',
    ]),

    ...mapMutations([
      'SET_RIGHT_SIDEBAR_OPEN',
    ]),
  },
};
</script>

<style scoped>
.messages {
  overflow-y: auto;
  flex: 1 1 0;
}

.participant-count {
  font-size: 0.8em;
  color: rgb(255 255 255 / 70%);
}
</style>
