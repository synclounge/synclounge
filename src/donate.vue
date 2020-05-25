<template>
  <v-card>
    <v-card-title class="title">
      Donate
      <v-spacer></v-spacer>
      <img :src="logos.light.small" style="height: 50px"/>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <p class="pa-2"> All donations to SyncLounge go directly towards running the SyncLounge public servers and the continued development of the application. </p>
      <v-subheader> How to donate </v-subheader>
      <v-layout row justify-center align-center class="pa-0 ma-1">
          <v-flex xs4 class="text-center">
            <v-btn block color="primary" class="white--text" target="_blank" href="https://paypal.me/PlexTogether">
              Paypal
            </v-btn>
          </v-flex>
        </v-layout>
      <div class="text-center pa-2">
        <v-layout row justify-center align-center v-for="(address, coin) in addresses" :key="coin" class="pa-0 ma-1">
          <v-flex xs2 style="font-weight: 600">
            {{ coin }}
          </v-flex>
          <v-flex xs8>
            {{ address }}
          </v-flex>
          <v-flex xs2 class="text-center">
            <v-icon v-clipboard="address" v-on:click.native="sendNotification()" class="mr-2 primary--text click-cursor">content_copy</v-icon>
          </v-flex>
        </v-layout>
      </div>
      <v-divider></v-divider>
      <p class="pa-2 soft-text mb-0 pb-0" >If you make a donation, stop by the Discord and message samcm#2715 to get your Donator role. Thankyou!</p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" flat @click.stop="onClose()">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

export default {
  props: {
    onClose: {
      type: Function,
      default: () => {}
    }
  },
  data () {
    return {
      addresses: {
        ETH: '0xC886a3b94867AC12901220BBcbFD407e60E009A5',
        LTC: 'LQkfMbcFGQgMZWw13hbzbYkRkSM6n1fZjE',
        BTC: '3Q7wZnUdJMQi53eH3dErms9Tno7VGmTHZL',
        BCH: '1K3ULWzW9dLyGbtpnNqUysHuj1suZFXtx4'
      }
    }
  }
}
</script>
