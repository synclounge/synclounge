<template>
  <div class="container center" style="padding: 10px;width:100%">
    <div class="row" style="margin-bottom: 0;">
      <div class="col s12">
        <h2 class="center" style="padding-bottom: 10px">Statistics</h2>
      </div>
    </div>
    <div class="row ">
      <table class="centered col s4 offset-s4">
        <thead>
        <tr>
          <th>Item Name</th>
          <th>Item Price</th>
        </tr>
        </thead>

        <tbody>
        <tr>
          <td style="text-align: right;">Difference from host</td>
          <td>550ms</td>
        </tr>
        <tr>
          <td style="text-align: right;">Your Plex Client Response Time</td>
          <td>{{chosenClientResponseTime}}</td>
        </tr>
        <tr>
          <td style="text-align: right;">Your Plex Together Server Respone Time </td>
          <td>{{yourPlexTogetherResponseTime}}</td>
        </tr>
        <tr>
          <td style="text-align: right;">Host response time to their Plex Client</td>
          <td>50ms</td>
        </tr>
        <tr>
          <td style="text-align: right;">Host response time to the Plex Together Server</td>
          <td>50ms</td>
        </tr>

        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  export default {
    props: ['object'],
    name: 'statistics',
    data () {
      return {}
    },
    methods: {
      //this.$store.dispatch('function',params)

    },
    computed: {
      plex: function () {
        return this.$store.state.plex
      },
      context: function () {
        return this.$store
      },
      chosenClientResponseTime: function () {
        if (!this.$store.getters.getStats.ourClientResponseTime) {
          return 'Unknown'
        }
        return this.$store.getters.getStats.ourClientResponseTime + 'ms'
      },
      yourPlexTogetherResponseTime: function () {
        if (!this.$store.getters.getStats.ourPTServerResponseTime) {
          return 'Unknown'
        }
        return this.$store.getters.getStats.ourPTServerResponseTime + 'ms'
      },
      syncmode: {
        get () {
          return this.$store.state.settings.SYNCMODE
        },
        set (value) {
          this.$store.commit('setSetting', {
            key: 'SYNCMODE',
            value: value
          })
        }
      },
      syncflexability: {
        get () {
          return this.$store.state.settings.SYNCFLEXABILITY
        },
        set (value) {
          this.$store.commit('setSetting', {
            key: 'SYNCFLEXABILITY',
            value: parseInt(value)
          })
        }
      },
      clientpollinterval: {
        get () {
          return this.$store.state.settings.CLIENTPOLLINTERVAL
        },
        set (value) {
          this.$store.commit('setSetting', {
            key: 'CLIENTPOLLINTERVAL',
            value: parseInt(value)
          })
        }
      }
    },
    mounted: function () {
      // Create event listeners
    }
  }
</script>

