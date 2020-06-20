import Vue from 'vue';

export default {
  ADD_PLEX_CLIENT: (state, client) => {
    Vue.set(state.clients, client.clientIdentifier, client);
  },

  SET_CHOSEN_CLIENT_ID: (state, id) => {
    state.chosenClientId = id;
  },

  SET_PLEX_CLIENT_TIMELINE: (state, timeline) => {
    state.plexClientTimeline = timeline;
  },

  SET_ACTIVE_MEDIA_METADATA: (state, metadata) => {
    state.activeMediaMetadata = metadata;
  },

  SET_ACTIVE_SERVER_ID: (state, id) => {
    state.activeServerId = id;
  },

  INCREMENT_COMMAND_ID: (state) => {
    state.commandId += 1;
  },

  SET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID: (state, commandId) => {
    state.previousSyncTimelineCommandId = commandId;
  },

  SET_CLIENT_CHOSEN_CONNECTION: (state, { clientIdentifier, chosenConnection }) => {
    Vue.set(state.clients[clientIdentifier], 'chosenConnection', chosenConnection);
  },
};
