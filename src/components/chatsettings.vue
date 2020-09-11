<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-x
  >
    <template #activator="stuff">
      <slot
        v-bind="stuff"
      />
    </template>

    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-action>
            <v-switch
              :input-value="ARE_NOTIFICATIONS_ENABLED && !isHttp"
              :disabled="isHttp"
              @change="CHANGE_NOTIFICATIONS_ENABLED"
            />
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Popup notifications</v-list-item-title>

            <v-list-item-subtitle v-if="isHttp">
              Popup notifications are only available in secure contexts (HTTPS)
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-action>
            <v-switch
              :input-value="ARE_SOUND_NOTIFICATIONS_ENABLED"
              @change="SET_ARE_SOUND_NOTIFICATIONS_ENABLED"
            />
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Sound notifications</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary"
          text
          @click="DISCONNECT_AND_NAVIGATE_HOME"
        >
          Leave Room
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  data: () => ({
    menu: false,
  }),

  computed: {
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
      'CHANGE_NOTIFICATIONS_ENABLED',
      'DISCONNECT_AND_NAVIGATE_HOME',
    ]),

    ...mapMutations('synclounge', [
      'SET_ARE_SOUND_NOTIFICATIONS_ENABLED',
    ]),
  },
};
</script>
