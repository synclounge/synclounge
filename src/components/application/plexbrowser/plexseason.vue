<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important"> Season {{ content.index }}<span
          v-if="browsingContent"> > </span> </span>
        <div v-if="!browsingContent" class="row">
            <div v-if="contents && !browsingContent">
                <v-card class="blue-grey darken-1 col l12 s12 hoverable" style="height:100%;box-shadow:none">
                    <div class="white-text row">
                        <img :src="getThumb(content)" style="height:100%" class="col s4 l2"/>
                        <div class="col l10 s8">
                            <h1 style="font-size: 3vh;"> {{ content.parentTitle }}</h1>
                            <h2 style="font-size: 2vh;" class="card-title truncate">{{ content.title }}</h2>
                            <label style="font-size: 2vh;"> {{ content.leafCount }} episodes </label>
                            <p> {{ content.summary }} </p>
                        </div>
                    </div>
                </v-card>
                <div class="divider"></div>
                <h5> Episodes </h5>
                <div v-for="content in contents.MediaContainer.Metadata">
                    <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s4 hoverable"
                            style="box-shadow:none">
                        <div class="white-text">
                            <img :src="getThumb(content)" style="width:100%"/>
                            <span style="font-size: 1vh;" class="card-title truncate">
                                {{ content.title }}
                            </span>
                            <span style="font-size: 1vh;" class="card-title truncate">
                                Episode {{ content.index }}
                            </span>
                        </div>
                    </v-card>
                </div>
            </div>
            <div v-if="!contents && !browsingContent" class="center">
                <v-progress-circular active large></v-progress-circular>
            </div>
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'" :content="browsingContent"
                     :server="server" :library="library"></plexcontent>
    </span>
</template>

<script>
  import plexcontent from './plexcontent'

  export default {
    props: ['library', 'server', 'content'],
    components: {
      plexcontent,
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      this.server.getSeriesContent(this.content.key, 0, 500, 1, function (result) {
        if (result) {
          that.contents = result
        } else {
          that.status = 'Error loading content!'
        }
      })
    },
    data () {
      return {
        browsingContent: null,

        contents: null,
        status: "loading..",
      }
    },
    mounted () {

    },
    beforeDestroy () {

    },
    computed: {},
    methods: {
      setContent (content) {
        this.browsingContent = content
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 12, h / 4)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
