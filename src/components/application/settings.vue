<template>
    <div class="container" style="padding: 10px; font-family:'Open Sans', sans-serif !important;">
        <div class="row" style="margin-bottom: 0;">
            <div class="col s12">
                <h4 style="padding-bottom: 10px">Settings</h4>
            </div>
        </div>
        <div class="row" style="margin-bottom: 0;">
            <div class="col l5 s12 s12">
                <h4 style="padding-bottom: 10px"><i class="material-icons"  title="Sets how frequently Plex Together will poll the client for new information. 
                Most clients can handle multiple requests per second but mobile devices might not be able to handle the load. Default is 5000ms (5 seconds)">info_outline</i> Plex Client Polling Interval </h4>
            </div>
            <div class="col l4 s12 s12">
                <form action="#" style="margin-top: -15px">
                    <p class="range-field">
                        <v-range v-model="clientpollinterval" :min="100" :max="10000"></v-range>
                    </p>
                </form>
            </div>
            <div class="col l3 s12">
                <input class="center" id="clientpollinginterval" type="number" step="10" v-model="clientpollinterval">
            </div>
        </div>

        <div class="row" style="margin-bottom: 0;">
            <div class="col l5 s12">
                <h4 style="padding-bottom: 10px"><i class="material-icons" title="Sets the acceptable distance away from the host in milliseconds. Syncs below 1500ms may be hard to achieve. Default is 3000ms(3 seconds).">info_outline</i> Sync Flexibility </h4>
            </div>
            <div class="col l4 s12">
                <form action="#" style="margin-top: -15px">
                    <p class="range-field">
                        <v-range v-model="syncflexability" :min="500" :max="10000"></v-range>
                    </p>
                </form>
            </div>
            <div class="col l3 s12">
                <input class="center" id="syncflexability" type="number" step="10" v-model="syncflexability">
            </div>
        </div>
        
        <div class="row" style="margin-bottom: 0;">
            <div class="col l5 s12">
                <h4 style="padding-bottom: 10px"><i class="material-icons" title="Sets the syncing method used when we need to get back in line with the host. 'Clean seek' seeks straight to the host. 'Skip ahead' skips 10 seconds ahead of the host, pauses and resumes when it thinks the host is there. Use 'Skip ahead' if buffering content on the client isn't close to instant.">info_outline</i> Syncing Method </h4>
            </div>
            <div class="input-field col l3 s6">
                <v-radio :name="syncModeInputs" id="CLEANSEEK" val="cleanseek" v-model="syncmode">Clean Seek</v-radio>
            </div>            
            <div class="input-field col l3 s6">
                <v-radio :name="syncModeInputs" id="SKIPAHEAD" val="skipahead" v-model="syncmode">Skip Ahead</v-radio>
            </div>
        </div>

    </div>
</template>

<script>

export default {
    props: ['object'],
    name: 'settings',
    data() {
        return {
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

