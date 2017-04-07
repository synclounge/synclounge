<template>
  <div class="window">  
      <div class="window-content">
          <div class="container">
              <div class="row">
                  <div v-if="plex == null" class="col s12 l6 offset-l3">
                      <div>
                          <h1 class="center">Sign in to Plex</h1>
                      </div>
                      <div class="row center">
                        <p> It's time to login to your Plex.tv account.</p>
                        <p class="col s12"> Your Plex account is used to fetch the details of your Plex devices. None of your private details are sent to our servers. If you would like to install and run Plex Together yourself
                          have a look <a target="_target" href="https://github.com/samcm/plextogether"> here </a> for details. </p>  
                      </div>
                      <div class="row">
                          <div class="col s12 l12">
                              <div class="row">
                                  <div class="input-field col s12">
                                      <input v-model="user" id="plexUsername" type="text" class="validate" placeholder="Enter Username">
                                  </div>
                                  <div class="input-field col s12">
                                      <input v-on:keyup.enter="hitAPI()" v-model="pass" id="plexPassword" type="password" class="validate" placeholder="Enter Password">
                                  </div>
                              </div>
                          </div>
                          <div class="col s12 l12 signin" style="text-align: center;">
                              <div v-if="signinProgress=='nothing' || signinProgress == 'failed'" class="progress-button">
                                <p v-on:click="hitAPI()" style="background-color:#E5A00D; width: 100%" class="waves-effect waves-light btn-large">Submit</p>
                              </div>
                              <div v-if="signinProgress=='sent'" class="preloader-wrapper active">
                                <div class="spinner-layer spinner-plex-orange-only">
                                  <div class="circle-clipper left">
                                    <div class="circle"></div>
                                    <div class="circle"></div>
                                  </div><div class="circle-clipper right">
                                    <div class="circle"></div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="errormsg">
                                <span class="blue-text text-darken-2">{{ errormsg }} </span>
                              </div>
                          </div>
                      </div>
                  </div>                  
              </div>
          </div>  
      </div>
  </div>
</template>

<script>
export default {
  name: 'signin',
  data () {
    return {
      signinProgress:'nothing',
      signedin: false,
      errormsg: null,
      user: '',
      pass: ''
    }
  },
  mounted() {
    if (window['localStorage'].getItem('plexuser') != null){
      this.$store.state.plexuser = JSON.parse(window['localStorage'].getItem('plexuser'))
    }
  },
  computed: {
    loggedIn: function() {
      return this.$store.state.plexuser
    }
  },
  methods: {
    signout: function(){
      window['localStorage'].removeItem('plexuser')
      this.$store.state.plexuser = null
    },
    hitAPI: function(){
      this.signinProgress = 'sent'
      this.errormsg = null
      var that = this
      var base64encoded = new Buffer(this.user + ":" + this.pass).toString('base64')

      this.$http.post('https://plex.tv/users/sign_in.json',null,{
        headers:{
          'Content-type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + base64encoded,
          'X-Plex-Client-Identifier': 'PlexTogetherWeb'
        }
      })
      .then((response) => {
        // success callback
        let jsonObj = response.body
        if (jsonObj.user){
          let storage = window['localStorage']
          storage.setItem('plexuser',JSON.stringify(jsonObj))
          that.$store.state.plexuser = jsonObj
          that.signedin = true    
          setTimeout(function(){
            that.$router.push('/app')
        },2000)
        } else {
          that.errormsg = response.body.error
          that.signinProgress = 'nothing'
        }
      }, (response) => {
        // error callback
        if (response.body != undefined && response.body.error != undefined){
          that.errormsg = response.body.error
        } else {
          that.errormsg = 'Sign in failed. Try again.'
        }
        that.signinProgress = 'failed'
      });
    }
  }
}
</script>

