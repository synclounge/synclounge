<template>
    <div class="row">
        <h2 class="col s12 l12 center">
            Hang on a second!
        </h2>
        <div class="col s12 l12">
            Plex Together has detected that you aren't loading this page via a public address. 
            This means if you send this link to someone they will likely be unable to connect. 
            If you know what this means and would still like to proceed, ignore this and press the continue button below.
            Otherwise, change the hostname below so that others can access PlexTogether.
        </div>    
    </div>
</template>

<script>

export default {
    props: [''],
    name: 'invite',
    data() {
        return {
            urlOrigin: window.location.origin
        }
    },
    methods: {
        //this.$store.dispatch('function',params)
        
    },
    computed: {
        plex: function(){
            return this.$store.state.plex
        },
        context: function(){
            return this.$store
        },
        syncmode: {
            get () {
                return this.$store.getters.getSettingSYNCMODE
            },
            set (value) {
                this.$store.commit('setSettingSYNCMODE',value)
            }
        },
        syncflexability: {
            get () {
                return this.$store.getters.getSettingSYNCFLEXABILITY
            },
            set (value) {
                this.$store.commit('setSettingSYNCFLEXABILITY',value)
            }
        },
        clientpollinterval: {
            get () {
                return this.$store.getters.getSettingCLIENTPOLLINTERVAL
            },
            set (value) {
               this.$store.commit('setSettingCLIENTPOLLINTERVAL',value)
            }
        }  
    },
    mounted: function() {
        // Create event listeners 
    }
}
</script>

