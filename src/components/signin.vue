<template>
  <div class="window">  
      <div class="window-content">
          <div class="container">
              <div class="row">
                  <div v-if="plex == null" class="col s12 l6 offset-l3">
                      <div>
                          <h1 class="center">Sign in to Plex.tv</h1>
                      </div>


                      <div v-if="!pin" class="center">
                            <v-progress-circular active large></v-progress-circular>
                      </div>      
                      <div v-if="token" class="center row">
                        <div class="col s12 l4 offset-l4">
                          <i style="font-size:150px; color:green" class="material-icons">done</i>
                        </div>                       
                         <div class="col s12 l4 offset-l4">                          
                            Signed in!
                        </div>
                      </div> 
                      <div v-if="pin && !token">                       
                        <div class="row">
                            <div class="col s12 l4 offset-l4">
                                <h1 class="center">{{ pin }}</h1>
                            </div>
                        </div>              
                        <div class="row">                           
                            <div class="col s4 l4 offset-l4 offset-s4">                                
                                <button style="width:100%;background-color: #E5A00D" class="waves-effect waves-light btn" v-clipboard="pin"><i class="material-icons left">content_paste</i>Copy</button>
                            </div>
                            <div class="col s12 l12">
                                <p class="center">Enter the pin above at <a target="_target" href="https://plex.tv/pin"> https://plex.tv/pin </a></p>
                            </div>

                        </div>                      
                        <div class="row center">
                          <label class="col s12"> Your Plex account is used to fetch the details of your Plex devices. None of your private details are sent to our servers. If you would like to install and run Plex Together yourself
                            have a look <a target="_target" href="https://github.com/samcm/plextogether"> here </a> for details. </label>  
                        </div>
                      </div>
                  </div>                  
              </div>
          </div>  
      </div>
  </div>
</template>

<script>


var parseString = require('xml2js').parseString;
var request = require('request')
var clipboard = require('clipboard')

export default {
  name: 'signin',
  data () {
    return {
      pin: null,
      ID: null,
      token: null,
      status: 'startup'
    }
  },
  mounted() {
    var that = this
    let storage = window['localStorage']
    storage.removeItem('plexuser')

    function getPin(){
      that.$http.post('https://plex.tv/pins.xml',null,{
        headers:{
          'X-Plex-Client-Identifier': 'PlexTogether'
        }
      })
      .then((response) => {

        parseString(response.body, function(err,result){
          if (!err){
            that.pin = result.pin.code[0]
            that.ID = result.pin.id[0]._





            let checker = setInterval(function(){
                var options = {
                  url: 'https://plex.tv/pins/' + that.ID + '.xml',
                  headers: {
                    'X-Plex-Client-Identifier': 'PlexTogether'
                  }
                };

                function callback(error, response, body) {
                  if (!error && response.statusCode == 404){
                    clearInterval(checker)
                    getPin()
                    return
                  }
                  if (!error && response.statusCode == 200) {
                    parseString(body, function(err, result){
                      if (!err){
                        if (result.pin.auth_token[0] != null && result.pin.auth_token[0].length > 1){
                          console.log('GOT TOKEN!')
                          that.token = result.pin.auth_token[0]
                          let jsonObj = {
                            authToken: that.token
                          }
                          storage.setItem('plexuser',JSON.stringify(jsonObj))
                          setTimeout(function(){
                              that.$router.push('/app')
                          },2500)
                          clearInterval(checker)
                        }
                      }
                    })
                  }
                }
                request(options, callback);
              },2000)
          }           
        })
        return
      })
    }
    getPin()
    
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

      
    }
  }
}
</script>

