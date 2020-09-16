<template>
  <v-app-bar-nav-icon
    @click="TOGGLE_RIGHT_SIDEBAR_OPEN"
  >
    <v-icon>
      {{
        isRightSidebarOpen ? 'last_page' : 'first_page'
      }}
    </v-icon>
  </v-app-bar-nav-icon>
</template>

<script>
import { mapMutations, mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['isRightSidebarOpen']),
  },

  methods: {
    ...mapMutations([
      'TOGGLE_RIGHT_SIDEBAR_OPEN',
    ]),
  },
};
</script>
