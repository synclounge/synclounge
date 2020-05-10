<template>
  <v-flex xs12>
    <v-layout row wrap justify-start align-center v-if="message.user.username === 'You'">
      <v-flex xs10 class="pr-2 ml-3 mb-1">
          <!-- <v-flex><span style="opacity:0.6;font-size:60%; float:right"> {{ message.time}}</span></v-flex> -->
            <div class="pt-1 pb-1 pl-2 pr-2 messageBubble me" style="">{{ message.msg }}</div>
      </v-flex>
      <v-flex xs1 class="text-xs-center pt-1">
        <v-tooltip bottom color="rgb(44, 44, 49)" multi-line>
          <span slot="activator">
            <img :src="message.user.thumb || message.user.avatarUrl" class="mt-2 messageAvatar" />
          </span>
          {{ message.time }}
        </v-tooltip>
      </v-flex>
    </v-layout>
    <v-layout row wrap justify-start align-center v-else>
      <v-flex xs1 class="text-xs-center pt-1 mr-2 ml-2">
        <v-tooltip bottom color="rgb(44, 44, 49)" multi-line>
          <span slot="activator">
            <img :src="message.user.thumb || message.user.avatarUrl" class="mt-2 messageAvatar" />
          </span>
          {{ message.time }}
        </v-tooltip>
      </v-flex>
      <v-flex xs10 class="pr-2 mr-2 mb-2">
          <!-- <v-flex><span style="opacity:0.6;font-size:60%; float:right"> {{ message.time}}</span></v-flex> -->
            <b class="pl-1" style="opacity:1;font-size:60%; float:left"> {{ message.user.username }}</b>

            <div class="pt-1 pb-1 pl-2 pr-2 messageBubble" style="">{{ message.msg }}</div>
      </v-flex>
    </v-layout>
  </v-flex>
</template>

<script>
export default {
  props: ['message'],
  methods: {},
};
</script>

<style>
.messageAvatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.messageBubble {
  background: rgb(44, 44, 49);
  border-radius: 7px;
  width: fit-content;
  clear: both;
  font-size: 90%;
  max-width: 100%;
  word-wrap: break-word;
  opacity: 0.8;
  color: white;
}

.messageBubble.me {
  background: #e5a00d;
  float: right;
  color: rgb(44, 44, 49);
}
</style>
