import Vue from 'vue'

export default {
    PLEX_SET_VALUE: (state, data) => {
        let key = data[0]
        let value = data[1]
        // console.log('Setting PLEX Key', key, 'to', value)
        Vue.set(state, key, value)
        state[key] = value
    },
    PLEX_CLIENT_SET_VALUE: (state, data) => {
        let client = data[0]
        let key = data[1]
        let value = data[2]
        // console.log('Setting CLIENT VALUE Key', key, 'to', value, client)
        Vue.set(state.clients[client.clientIdentifier], key, value)
        //state.clients[client.clientIdentifier][key] = value
    },   
    PLEX_SERVER_SET_VALUE: (state, data) => {
        let server = data[0]
        let key = data[1]
        let value = data[2]
        Vue.set(state.servers[server.clientIdentifier], key, value)
    },

    PLEX_CLIENT_SET: (state, client) => {
        // state.clients[client.clientIdentifier] = client
        Vue.set(state.clients, client.clientIdentifier, client)
    },   
    PLEX_SERVER_SET: (state, server) => {
        // state.servers[server.clientIdentifier] = server
        Vue.set(state.servers, server.clientIdentifier, server)
    },

    PLEX_SERVER_SET_CONNECTION: (state, data) => {
        let { server, connection } = data
        state.servers[server.clientIdentifier].chosenConnection = connection
    },     
    PLEX_CLIENT_SET_CONNECTION: (state, data) => {
        let { client, connection } = data
        state.clients[client.clientIdentifier].chosenConnection = connection
    } 
};
