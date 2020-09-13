<template>
  <div
    v-if="hide && !override"
    @click="override = true"
  >
    Summary automatically hidden for unwatched content. Click to unhide.
  </div>

  <div v-else>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    hide: {
      type: Boolean,
      required: true,
    },
  },

  data: () => ({
    override: false,
  }),
};
</script>
