<template>
  <v-layout wrap row>
    <v-flex xs12 md8 offset-md2>
      <h1 class="white--text center-text pa-4">Successfully signed out</h1>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'signout',
  mounted () {
    window['localStorage'].removeItem('plexuser')
    this.$store.state.plex = null
    this.$store.state.signedin = 'notsignedin'
    setTimeout(() => {
      this.$router.push('/')
    }, 2500)
  }
}
</script>
