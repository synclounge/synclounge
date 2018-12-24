<template>
  <div>
    <v-layout row wrap>
      <v-flex xs10 offset-xs1 lg4 offset-lg4>
        <img style="max-width:100%" v-bind:src="logo">
      </v-flex>
    </v-layout>
    <v-layout row wrap>
      <v-flex xs3 offset-xs6 class="center-text">
        <h1 style="color:white">G'day</h1>
      </v-flex>
    </v-layout>
    <v-layout row wrap justify-center>
      <v-flex xs12 md6 class="pa-4">
        <p> SyncLounge (previously PlexTogether) is a tool to sync Plex playback with friends and family anywhere in the world.
          We started off with a Python script which we distributed amongst our friends. With a command line based UI we quickly realised this was too difficult for our friends to use reliably.
          After playing around with the concept we decided to make a version that we could release that all Plex users could enjoy.
        </p>
        <h4> How it works </h4>
        <p>
          SyncLounge aims to keep multiple viewing sessions in sync regardless of whether the clients are in the same room or across the globe. To do this SyncLounge utilizes a middle-man server to communicate between each of SyncLounge clients.
          Users choose their Plex client, decide on a SyncLounge Server and Room name and join up. Your friends/family can do the same. Whoever joins the room first will become the host.
        </p>
        <p>
          The host has complete control over a room. Commands they send to their client will be sent through to other people in the room (Play, Pause, Seek etc). If the host starts playing something different,
          SyncLounge will search all of your available Plex Media Servers for an equiavalent copy, even if it is not from the same Plex Media Server as the Host.
        </p>
        <p>
          SyncLounge is licensed under the terms of the MIT license and is in no way affiliated with Plex Inc. </p>
        <div class="center-text">
          <p> We hope you enjoy. </p>
          <router-link to="/browse" class="center nav-item nav-link center-text" style="font-size:250%"> <v-btn :to="'/browse'" color="blue">Let's get started</v-btn> </router-link>
        </div>
      </v-flex>
    </v-layout>
  </div>

</template>

<script>
export default {
  name: 'home',
  created() {
    if (this.$store.getters.getSettingHOMEINIT) {
      this.$router.push('/browse');
    }
  },
  mounted() {
    this.$store.commit('setSettingHOMEINIT', true);
  },
  methods: {
    letsStart() {
      this.$router.push('/');
    },
  },
  computed: {
    logo() {
      return 'slweb/logo-long-light.png';
    },
    firstRun() {
      return !this.$store.getters.getSettingHOMEINIT;
    },
  },
};
</script>
