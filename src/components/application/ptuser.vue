<template>
    <li v-if="object" class="mdc-list-item avatar ptuser mainUser" style="height: 100%; margin-bottom: 1%;">
        <span class="mdc-list-item__start-detail" style="height:50px; width: 50px">
            <img v-bind:src="object.avatarUrl" class="circle plex-gamboge-border" style="height: 54px; width: 54px">
        </span>
        <span class="mdc-list-item__text" style="width: 89%; line-height: 1.2">
            <span class="mdc-list-item__text__primary">
                <div class="ptuser-username">{{ object.username }} </div>
                <small class="ptuser-title"><i class="material-icons" v-if="playerState" style="font-size:smaller">{{ playerState }}</i>  {{ getTitle }}</small>
                <i class="material-icons plex-gamboge-text ptuser-role right" v-bind:style="{ display: isHost }">
                    star
                </i>
            </span>
            <span class="mdc-list-item__text__secondary" id="metaDropdownDiv" >
                <div class="progress" style="margin-bottom: 0">
                    <div class="determinate ptuser-percent" v-bind:style="{ width: percent }"></div>
                </div>
                <div>
                    <small style="float: left" class="ptuser-time">{{ getCurrent }}</small>
                    <small style="float: right" class="ptuser-maxTime">{{ getMax }}</small>
                </div>
            </span>
        </span>
    </li>
</template>

<script>
export default {
    props: ['object'],
    name: 'ptuser',
    methods: {
        getTimeFromMs(ms) {
            var hours = ms / (1000 * 60 * 60)
            var absoluteHours = Math.floor(hours)
            var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours
            var minutes = (hours - absoluteHours) * 60
            var absoluteMinutes = Math.floor(minutes)
            var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes
            var seconds = (minutes - absoluteMinutes) * 60
            var absoluteSeconds = Math.floor(seconds)
            var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds
            return (h + ':' + m + ':' + s)
        }
    },
    computed: {
        isHost: function(){
            if (this.object.role == 'host'){
                return 'block'
            }
            return 'none'
        },
        percent: function(){
            return (parseInt(this.object.time) / parseInt(this.object.maxTime))*100 + '%'
        },
        getCurrent: function(){
            if (isNaN(this.object.time)){
                return ''
            }
            return this.getTimeFromMs(this.object.time)
        },
        getMax: function(){            
            if (isNaN(this.object.maxTime)){
                return ''
            }
            return this.getTimeFromMs(this.object.maxTime)
        },
        getTitle: function(){
            if (this.object.title && this.object.title.length > 0){
                return this.object.title
            } 
            return 'Nothing'
        },
        playerState: function(){
            if (this.object.playerState){
                if (this.object.playerState == 'stopped'){
                    return 'stop'
                }
                if (this.object.playerState == 'paused'){
                    return 'pause'
                }
                if (this.object.playerState == 'playing'){
                    return 'play_arrow'
                }
            }
            return false
        }
    }
}
</script>

