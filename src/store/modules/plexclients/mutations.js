import Vue from 'vue';

export default {
  ADD_PLEX_CLIENT: (state, client) => {
    Vue.set(state.clients, client.clientIdentifier, client);
  },

  SET_CHOSEN_CLIENT_ID: (state, id) => {
    state.chosenClientId = id;
  },
};
