<template>
    <span ref="root">

    </span>
</template>

<script>
import plexthumb from './plexthumb.vue'
import plexseason from './plexseason.vue'
import plexseries from './plexseries.vue'
import plexcontent from './plexcontent.vue'

export default {
  components: {
    plexthumb,
    plexseason,
    plexseries,
    plexcontent
  },
  created () {
    this.server.getMediaByRatingKey(this.content.ratingKey).then((result) => {
      if (result) {
        this.contents = result
        if (result.type === 'episode') {
          this.server.getSeriesChildren(result.parentKey + '/children', 0, 500, 1).then((res) => {
            if (res) {
              this.parentData = res
            }
          })
        }
        this.setBackground()
      } else {
        this.status = 'Error loading libraries!'
      }
    })
  },
  data () {
    return {
      contents: null
    }
  },
  mounted () {
  },
  beforeDestroy () {

  },
  computed: {
    ratingKey: function () {
      return this.$route.params.ratingKey
    }
  },
  methods: {

  }
}
</script>
