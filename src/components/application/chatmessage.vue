<template>
    <li>   
        <div class="row" v-if="object.type == 'message'" style="margin: 2px; border-bottom-width: 1px; border-bottom-color: rgba(0,0,0,0.1); border-bottom-style: solid">
            <div class="hide-on-med-and-down col s2">
                <img v-bind:src="object.user.thumb" class="circle plex-gamboge-border" style="height: 42px; width: 42px">
            </div>
            <div class="col s10">
                <div class="row" style="margin: 0">
                    <span class="plex-gamboge-text">{{ object.user.username }}</span> <span style="opacity:0.7;" class="mdc-list-item__text__secondary chat-body">  {{ object.time }}</span>
                </div>
                <div class="row chat-body">
                    {{ object.msg }}
                </div>
            </div>
        </div>
        <div class="row" v-if="object.type == 'alert'" style="margin: 2px; border-bottom-width: 1px; border-bottom-color: rgba(0,0,0,0.1); border-bottom-style: solid">
            <div class="col s2">
                <img v-bind:src="object.user.avatarUrl" class="circle plex-gamboge-border" style="height: 42px; width: 42px">
            </div>
            <div class="col s10">
                <div class="row" style="margin: 0">
                    <span style="font-style: italic" class="plex-gamboge-text">{{ object.msg }}</span> <span style="opacity:0.7;" class="mdc-list-item__text__secondary chat-body">  {{ object.time }}</span>
                </div>
            </div>
        </div>
    </li>
</template>


<script>
export default {
    props: ['object'],
    name: 'chatmessage',
    data() {
        return {
        }
    },
    methods: {
    },
    computed: {
    },    
    mounted: function() {
        // Create event listeners 
    }
}
</script>

