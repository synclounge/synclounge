<template>
    <div class="row center container" style="margin-top:20%">
        <div class="col s12 m12 l12">
            <div class="row">
                <div class="col s12 l4 m4">
                    <img :src="metadataThumb" style="width:100%;height:auto">
                </div>
                <div class="col s12 l8 m8" style="text-align:left">
                    <h2> {{chosenClient.name}} </h2>
                    <label>Playing {{ metadataTitle }} {{ metadataInfo }} from {{ metadataServer }}</label>
                    <p> {{metadata.summary}}</p>

                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    props: ['object'],
    name: 'nowplaying',
    data() {
        return {
        }
    },
    components: {        
    },
    computed: {
        chosenClient: function(){
            return this.$store.getters.getChosenClient
        },
        plex: function(){
            return this.$store.getters.getPlex
        },          
        validPlex: function(){
            if (!this.$store.state.plex) {                
                return false
            }
            return true
       },
        context: function(){
            return this.$store
        },      
        metadataThumb: function(){
            if (!this.validPlex ) {                
                return ''
            }
            let plexObj = this.$store.state.plex
            if (!this.$store.getters.getChosenClient){
                return ''
            }
            let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
            if (!metadata){
                return ''
            }
            let server;
            let content = metadata.thumb;
            if (metadata.parentThumb){
                content = metadata.parentThumb
            }
            if (!plexObj.getServerById(metadata.machineIdentifier)){
                return ''
            }
            return plexObj.getServerById(metadata.machineIdentifier).getUrlForLibraryLoc(content,700,700)
        },
        metadataServer: function(){
            if (!this.validPlex){
                return ''
            }
            if (!this.$store.getters.getChosenClient){
                return ''
            } 
            let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
            if (!metadata){
                return ''
            }
            return (this.plex.getServerById(this.chosenClient.clientPlayingMetadata.machineIdentifier).name)
        },
        metadataTitle: function(){
            if (!this.validPlex){
                return ''
            }
            if (!this.$store.getters.getChosenClient){
                return ''
            } 
            let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
            if (!metadata){
                return ''
            }
            if (metadata.type == 'movie'){
                return metadata.title
            } 
            if (metadata.type == 'episode'){
                return metadata.grandparentTitle
            }
            return metadata.index
        },
        metadataInfo: function(){
            if (!this.validPlex){
                return ''
            }
            if (!this.$store.getters.getChosenClient){
                return ''
            }
            let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata           
            if (!metadata){
                return ''
            }
            if (metadata.type == 'movie'){
                return '('+metadata.year+')'
            } 
            if (metadata.type == 'episode'){
                return metadata.title + ' (S' + metadata.parentIndex + '·E' + metadata.index + ')'
            }
            return metadata.index
            
        },
        metadata: function(){
            if (!this.validPlex){
                return ''
            }
            if (!this.$store.getters.getChosenClient){
                return ''
            }
            return this.$store.getters.getChosenClient.clientPlayingMetadata      
        }
    },
    methods: {
        
    }
}
</script>

