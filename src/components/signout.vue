<template>
  <div class="window">  
      <div class="window-content">
          <h2 class="center">
              Sign out successful! 
          </h2>  
      </div>
  </div>
</template>

<script>
export default {
  name: 'signout',
  mounted () {
    window['localStorage'].removeItem('plexuser')
    this.$store.state.plex = null
    this.$store.state.signedin = 'notsignedin'
    var that = this
    setTimeout(function(){
        that.$router.push('/')
    },2500)
  }
}
</script>

