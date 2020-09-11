<template>
  <v-dialog max-width="350">
    <template #activator="stuff">
      <slot v-bind="stuff" />
    </template>

    <v-card>
      <v-card-title>Plex Settings</v-card-title>

      <v-card-text>
        <v-list>
          <v-list-item>
            <v-select
              v-model="BLOCKEDSERVERS"
              label="Blocked Servers"
              :items="localServersList"
              item-value="id"
              item-text="name"
              multiple
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
                Blocks SyncLounge from searching these servers when attempting to
                autoplay content.
              </span>
            </v-tooltip>
          </v-list-item>

          <v-list-item>
            <v-text-field
              :value="GET_ALTUSERNAME"
              :placeholder="GET_PLEX_USER.username"
              label="Display name"
              @change="SET_ALTUSERNAME"
            />
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'ThePlexSettingsDialog',

  computed: {
    ...mapGetters('plexservers', [
      'GET_PLEX_SERVERS',
      'GET_BLOCKED_SERVER_IDS',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_USER',
    ]),

    ...mapGetters('settings', [
      'GET_ALTUSERNAME',
    ]),

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
    ...mapMutations('plexservers', [
      'SET_BLOCKED_SERVER_IDS',
    ]),

    // TODO: potentially add system for announcing username changes
    ...mapMutations('settings', [
      'SET_ALTUSERNAME',
    ]),
  },
};
</script>
