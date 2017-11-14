export default {
    PLEX_SET_VALUE: (state, data) => {
        let key = data[0]
        let value = data[1]
        console.log('Setting PLEX Key', key, 'to', value)
        state[key] = value
    },
    PLEX_CLIENT_SET_VALUE: (state, data) => {
        let client = data[0]
        let key = data[1]
        let value = data[2]
        console.log('Setting CLIENT VALUE Key', key, 'to', value)
        state.clients[client.clientIdentifier][key] = value
    },
    PLEX_ADD_CLIENT: (state, client) => {
        state.clients[client.clientIdentifier] = client
    },
    PLEX_ADD_SERVER: (state, server) => {
        state.servers[server.clientIdentifier] = server
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
