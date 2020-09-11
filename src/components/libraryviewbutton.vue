<template>
  <v-btn
    icon
    @click="TOGGLE_LIBRARY_LIST_VIEW"
  >
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  computed: {
    ...mapGetters([
      'IS_LIBRARY_LIST_VIEW',
    ]),

    icon() {
      return this.IS_LIBRARY_LIST_VIEW
        ? 'view_module'
        : 'view_list';
    },
  },

  methods: {
    ...mapMutations([
      'TOGGLE_LIBRARY_LIST_VIEW',
    ]),
  },
};
</script>
