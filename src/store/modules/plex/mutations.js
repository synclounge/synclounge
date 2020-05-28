import Vue from 'vue';

export default {
  PLEX_SET_VALUE: (state, data) => {
    const key = data[0];
    const value = data[1];
    // console.log('Setting PLEX Key', key, 'to', value)
    Vue.set(state, key, value);
    state[key] = value;
  },
  PLEX_CLIENT_SET_VALUE: (state, data) => {
    const client = data[0];
    const key = data[1];
    const value = data[2];
    // console.log('Setting CLIENT VALUE Key', key, 'to', value, client)
    Vue.set(state.clients[client.clientIdentifier], key, value);
    // state.clients[client.clientIdentifier][key] = value
  },
  PLEX_SERVER_SET_VALUE: (state, data) => {
    const server = data[0];
    const key = data[1];
    const value = data[2];
    Vue.set(state.servers[server.clientIdentifier], key, value);
  },

  PLEX_CLIENT_SET: (state, client) => {
    // state.clients[client.clientIdentifier] = client
    Vue.set(state.clients, client.clientIdentifier, client);
  },
  PLEX_SERVER_SET: (state, server) => {
    // state.servers[server.clientIdentifier] = server
    Vue.set(state.servers, server.clientIdentifier, server);
  },

  PLEX_SERVER_SET_CONNECTION: (state, { server, connection }) => {
    state.servers[server.clientIdentifier].chosenConnection = connection;
  },
  PLEX_CLIENT_SET_CONNECTION: (state, { client, connection }) => {
    state.clients[client.clientIdentifier].chosenConnection = connection;
  },
  SET_ITEMCACHE: (state, [ratingKey, newData]) => {
    if (!state.itemCache[newData.machineIdentifier]) {
      state.itemCache[newData.machineIdentifier] = {};
    }
    Vue.set(state.itemCache[newData.machineIdentifier], ratingKey, newData);
  },
  SET_LIBRARYCACHE: (state, [id, machineIdentifier, newData]) => {
    if (!state.libraryCache[machineIdentifier]) {
      state.libraryCache[machineIdentifier] = {};
    }
    Vue.set(state.libraryCache[machineIdentifier], id, newData);
  },
};
