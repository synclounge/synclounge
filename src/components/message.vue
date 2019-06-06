<template>
  <v-flex align-center xs12 class="pb-1">
    <v-layout row wrap justify-start>
      <v-flex xs3 class="text-xs-center">
        <img :src="message.user.thumb || message.user.avatarUrl" style="width: 36px; height: 36px; border-radius: 50%" />
      </v-flex>
      <v-flex xs9 class="pr-2">
        <v-layout row wrap>
          <v-flex><b style="opacity:1;font-size:80%; float:left"> {{ message.user.username }}</b></v-flex>
          <v-flex><span style="opacity:0.6;font-size:60%; float:right"> {{ message.time}}</span></v-flex>
          <v-flex xs12>
            <div style="opacity:0.8;color:white;font-size:90%; max-width: 100%; word-wrap: break-word"> {{ message.msg }}</div>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout row class="pt-1">
      <v-divider style="opacity: 0.6"></v-divider>
    </v-layout>
  </v-flex>
</template>

<script>
export default {
  props: ['message'],
  methods: {
  }
}
</script>

