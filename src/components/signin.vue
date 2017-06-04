<template>
  <div class="window">
      <div class="window-content">
          <div class="container">
              <div class="row">
                  <div v-if="plex == null" class="col s12 l6 offset-l3">
                      <div>
                          <h1 class="center">Sign in to Plex.tv</h1>
                      </div>


                      <div v-if="!pin" class="center spinner-orange">
                            <v-progress-circular active large></v-progress-circular>
                      </div>
                      <div v-if="token" class="center row">
                        <div class="col s12 l4 offset-l4">
                          <i style="font-size:150px; color:green" class="material-icons">done</i>
                        </div>
                         <div class="col s12 l4 offset-l4" style="color:white">
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
                                <p class="center">Enter the pin above at <a target="_blank" href="https://plex.tv/link"> https://plex.tv/link </a></p>
                            </div>

                        </div>
                        <div class="row center">
                          <label class="col s12"> Your Plex account is used to fetch the details of your Plex devices. None of your private details are sent to our servers. If you would like to install and run Plex Together yourself
                            have a look <a target="_blank" href="https://github.com/samcm/plextogether"> here </a> for details. </label>
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
    let id = (Math.random()*1e32).toString(36)
    function getPin(){
      var sBrowser, sUsrAg = navigator.userAgent;

      if(sUsrAg.indexOf("Chrome") > -1) {
          sBrowser = "Google Chrome";
      } else if (sUsrAg.indexOf("Safari") > -1) {
          sBrowser = "Apple Safari";
      } else if (sUsrAg.indexOf("Opera") > -1) {
          sBrowser = "Opera";
      } else if (sUsrAg.indexOf("Firefox") > -1) {
          sBrowser = "Mozilla Firefox";
      } else if (sUsrAg.indexOf("MSIE") > -1) {
          sBrowser = "Microsoft Internet Explorer";
      }
      console.log('Browser: ' + sBrowser)

      that.$http.post('https://plex.tv/pins.xml',null,{
        headers:{
          'X-Plex-Device':'Web',
          'X-Plex-Device-Name':'PlexTogether',
          'X-Plex-Product':'PlexTogether',
          'X-Plex-Version':'1.0',
          'X-Plex-Platform':sBrowser,
          'X-Plex-Platform-Version':'',
          'X-Plex-Client-Identifier': id
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
                      'X-Plex-Device':'Web',
                      'X-Plex-Device-Name':'PlexTogether',
                      'X-Plex-Product':'PlexTogether',
                      'X-Plex-Version':'1.0',
                      'X-Plex-Platform':sBrowser,
                      'X-Plex-Platform-Version':'',
                      'X-Plex-Client-Identifier': id
                  }
                };

                function callback(error, response, body) {
                  if (!error && response.statusCode == 404){
                    clearInterval(checker)
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
                              that.$router.push('/sync')
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

