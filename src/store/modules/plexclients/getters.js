export default {
  GET_CHOSEN_CLIENT_ID: (state) => state.chosenClientId,
  GET_CHOSEN_CLIENT: (state) => state.clients[state.chosenClientId],
  GET_RECENT_PLEX_CLIENTS: (state) => Object.values(state.clients)
    .sort((a, b) => -a.lastSeenAt.localeCompare(b.lastSeenAt)),
  GET_CLIENT_PLAYING_METADATA: (state) => state.clientPlayingMetadata,
};
