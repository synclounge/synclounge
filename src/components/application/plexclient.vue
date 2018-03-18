<template>
  <div>
    <span
      ref=""
      v-bind:class="{
        connection_success: connection_success,
        connection_wait: connection_wait,
        connection_failed: connection_failed,
        connection_fresh: connection_fresh,
        truncate: isTrunc
                    }"
       href="#" v-bind:style="styleObj">
      {{ object.name }}
    </span>
    <span class="grey--text" style="opacity:.8">
      {{ object.product }}
    </span>
  </div>
</template>

<script>
export default {
  props: ['object', 'selected', 'startup', 'sidebar'],
  name: 'plexclient',
  methods: {},
  computed: {
    tooltipMsg: function () {
      return (this.object.name + ' running ' + this.object.product + ' on ' + this.object.device)
    },
    connection_success: function () {
      if (this.object.connectedstatus === 'connected') {
        return true
      }
    },
    connection_wait: function () {
      if (this.object.connectedstatus === 'waiting') {
        return true
      }
    },
    connection_failed: function () {
      if (this.object.connectedstatus === 'failed') {
        return true
      }
    },
    connection_fresh: function () {
      if (this.object.connectedstatus === 'fresh') {
        return true
      }
    },
    isTrunc: function () {
      if (this.sidebar) {
        return true
      }
      return false
    },
    styleObj: function () {
      if (this.sidebar) {
        return {
          height: '30px'
        }
      }
      if (!this.startup) {
        return {
          height: '30px'
        }
      }
      if (this.selected) {
        return {
          'font-weight': '700',
          height: '30px'
        }
      } else {
        return {
          height: '30px',
          opacity: '0.7'
        }
      }
    }
  }
}
</script>
