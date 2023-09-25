<template>
  <v-navigation-drawer
    app
    temporary
    :value="isLeftSidebarOpen"
    disable-route-watcher
    @input="SET_LEFT_SIDEBAR_OPEN"
  >
    <v-list-item v-if="GET_PLEX_USER">
      <v-list-item-avatar>
        <v-img
          :src="GET_PLEX_USER.thumb"
        />
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title style="font-weight: bold;">
          {{ GET_PLEX_USER.username }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider />

    <v-list
      dense
      nav
    >
      <TheSettingsDialog v-slot="{ on, attrs }">
        <v-list-item
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-icon>
            <v-icon>settings</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </TheSettingsDialog>

      <v-list-item
        :router="true"
        :to="{ name: 'SignOut' }"
      >
        <v-list-item-icon>
          <v-icon>cancel</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Sign out</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>About</v-subheader>

      <v-list-item
        :href="GET_RELEASE_URL"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon>info</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>v{{ version }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :href="discordUrl"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon>chat</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Discord</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :href="repositoryUrl"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon>code</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>GitHub</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <DonateDialog v-slot="{ on, attrs }">
        <v-list-item
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-icon>
            <v-icon>favorite</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Donate</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </DonateDialog>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex';

export default {
  name: 'TheSidebarLeft',

  components: {
    TheSettingsDialog: () => import('@/components/TheSettingsDialog.vue'),
    DonateDialog: () => import('@/components/DonateDialog.vue'),
  },

  computed: {
    ...mapState([
      'isLeftSidebarOpen',
      'version',
      'repositoryUrl',
      'discordUrl',
    ]),

    ...mapGetters([
      'GET_RELEASE_URL',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_USER',
    ]),
  },

  methods: {
    ...mapMutations([
      'SET_LEFT_SIDEBAR_OPEN',
    ]),
  },
};
</script>
