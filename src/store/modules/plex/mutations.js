import Vue from 'vue';

export default {
  PLEX_CLIENT_SET_VALUE: (state, data) => {
    const client = data[0];
    const key = data[1];
    const value = data[2];
    // console.log('Setting CLIENT VALUE Key', key, 'to', value, client)
    Vue.set(state.clients[client.clientIdentifier], key, value);
    // state.clients[client.clientIdentifier][key] = value
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

  SET_DONE_FETCHING_DEVICES: (state, done) => {
    state.doneFetchingDevices = done;
  },

  SET_DEVICE_FETCH_PROMISE: (state, promise) => {
    state.deviceFetchPromise = promise;
  },

  SET_PLEX_USER: (state, user) => {
    state.user = user;
  },

};
