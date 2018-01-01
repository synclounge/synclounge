<template>
    <div style="margin-bottom: 0; height:100%">
        <div style="margin-bottom: 0; height:100%">
            <v-layout row wrap style="overflow-y: scroll">
                <v-flex xs12>
                    <div v-if="!ptConnected || !chosenClient || !ptRoom">
                        <walkthrough class="pa-4"></walkthrough>
                    </div>
                    <div v-else>
                        <plexbrowser v-if="showBrowser" class="pa-4"></plexbrowser>
                        <ptplayer v-if="isPTPlayer"></ptplayer>
                        <plexcontent v-if="showMetadata" class="pa-4" nowPlaying :content="chosenClient.clientPlayingMetadata" :server="nowPlayingServer"></plexcontent>
                    </div>
                </v-flex>
            </v-layout>
        </div>
    </div>
</template>

<script>
// Components
import plexclient from './application/plexclient'
import ptuser from './application/ptuser'
import joinroom from './application/joinroom'
import walkthrough from './application/walkthrough'
import ptplayer from './application/ptplayer'
import plexbrowser from './application/plexbrowser'
import plexcontent from './application/plexbrowser/plexcontent'
import nowplaying from './application/nowplaying'

import { mapState } from 'vuex'

export default {
    name: 'application',
    components: {
        plexclient,
        joinroom,
        ptuser,
        walkthrough,
        ptplayer,
        plexbrowser,
        nowplaying,
        plexcontent
    },
    mounted: function () {
        
    },
    created: function () {
    },
    data () {
        return {
            clientpollers: [],
            showToggleChat: false,
            messageToBeSent: ''
        }
    },
    computed: {
        ...mapState(['plex']),
        chosenClient: function () {
            return this.$store.getters.getChosenClient
        },
        router: function () {
            return this.$route.matched
        },
        validPlex: function () {
            return (this.plex)
        },
        items: function () {
            let data = []
            let map = {
                browse: () => {
                    return {
                        text: 'Home',
                        to: '/browse'
                    }
                },
                server: () => {
                    return {
                        text: this.plex.servers[this.$route.params.machineIdentifier].name,
                        to: '/browse/' + this.$route.params.machineIdentifier
                    }
                },
                content: () => {
                    return {
                        text: 'Loading...',
                        to: '/browse/' + this.$route.params.machineIdentifier + '/' + this.$route.params.ratingKey
                    }
                }
            }
            this.$route.matched.forEach((route) => {
                if (!route || route.path === '') return
                data.push(
                    map[route.name]()
                )
            })
            return data
        },
        validDevices: function () {
            if (!this.plex) {
                return false
            }
            return this.plex.gotDevices
        },
        showBrowser () {
            return (this.chosenClient && !this.chosenClient.clientPlayingMetadata && this.ptRoom)
        },
        isPTPlayer () {
            return (this.chosenClient && this.chosenClient.clientIdentifier == 'PTPLAYER9PLUS10')
        },
        showMetadata () {
            return (!this.isPTPlayer && !this.showBrowser && this.chosenClient && this.chosenClient.clientPlayingMetadata)
        },
        darkMode: function () {
            return this.$store.getters.getSettingDARKMODE
        },
        ptConnected: function () {
            return this.$store.getters.getConnected
        },
        ptServer: function () {
            return this.$store.getters.getServer
        },
        ptRoom: function () {
            return this.$store.getters.getRoom
        },
        ptPassword: function () {
            return this.$store.getters.getPassword
        },
        ptUsers: function () {
            return this.$store.getters.getUsers
        },
        userCount: function () {
            let count = this.$store.getters.getUsers.length
            if (count == 1) {
                return count + ' user'
            }
            return count + ' users'
        },
        chatBoxMessage: function () {
            return 'Message ' + this.$store.getters.getRoom
        },
        playercount: function () {
            if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
                return '(' + this.$store.state.plex.clients.length + ')'
            }
            return ''
        },
        servercount: function () {
            if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
                return '(' + this.$store.state.plex.servers.length + ')'
            }
            return ''
        },
        showChatValue: function () {
            if (this.$store.getters.getShownChat) {
                return 'block'
            }
            return 'none'
        },
        messages: function () {
            return this.$store.getters.getMessages
        },
        step1Complete: function () {
            if (this.chosenClient) {
                return '0.2'
            }
            return '1'
        },
        upToStep2: function () {
            if (this.chosenClient) {
                return '1'
            }
            return '0.2'
        },
        stateTESTING: function () {
            return this.$store
        },
        nowPlayingServer: function () {
            if (!this.chosenClient.clientPlayingMetadata){
                return null
            }
            return this.plex.servers[this.chosenClient.clientPlayingMetadata.machineIdentifier]
        }

    },
    methods: {
        openJoinRoomModal: function () {
            //console.log('trying to open')
            return this.$refs.joinroomModal.open()
            //$('#joinRoomModal').modal('open');
        },
        joinRoomModalClosed: function () {
            if (!this.ptRoom) {
                this.$store.dispatch('disconnectServer')
            }
        },
        showChat: function () {
            this.showToggleChat = !this.showToggleChat
        },
        sendMessage: function () {
            this.$store.dispatch('sendNewMessage', this.messageToBeSent)
            this.messageToBeSent = ''
        }
    }

}
</script>

