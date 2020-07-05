import axios from 'axios';

export default {
  GET_CHOSEN_CLIENT_ID: (state) => state.chosenClientId,

  GET_PLEX_CLIENT: (state) => (clientIdentifier) => state
    .clients[clientIdentifier],

  GET_CHOSEN_CLIENT: (state) => state.clients[state.chosenClientId],

  GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN: (state) => Object.values(state.clients)
    .sort((a, b) => -a.lastSeenAt.localeCompare(b.lastSeenAt))
    .map((client) => client.clientIdentifier),

  GET_ACTIVE_MEDIA_METADATA: (state) => state.activeMediaMetadata,

  GET_ACTIVE_SERVER_ID: (state) => state.activeServerId,

  GET_PLEX_CLIENT_TIMELINE: (state) => state.plexClientTimeline,

  GET_PLEX_CLIENT_AXIOS: (state, getters, rootState, rootGetters) => (clientIdentifier) => {
    const client = getters.GET_PLEX_CLIENT(clientIdentifier);

    return axios.create({
      baseURL: client.chosenConnection.uri,
      // TODO: examine this timeout...
      timeout: 5000,
      headers: {
        ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](client.accessToken),
        'X-Plex-Target-Client-Identifier': clientIdentifier,
      },
    });
  },

  GET_CHOSEN_PLEX_CLIENT_AXIOS: (state, getters) => (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10'
    ? null
    : getters.GET_PLEX_CLIENT_AXIOS(getters.GET_CHOSEN_CLIENT_ID)),

  GET_ACTIVE_MEDIA_POLL_METADATA: (state, getters) => (getters.GET_ACTIVE_MEDIA_METADATA
    ? {
      title: getters.GET_ACTIVE_MEDIA_METADATA.title,
      type: getters.GET_ACTIVE_MEDIA_METADATA.type,
      grandparentTitle: getters.GET_ACTIVE_MEDIA_METADATA.grandparentTitle,
      parentTitle: getters.GET_ACTIVE_MEDIA_METADATA.parentTitle,
      ratingKey: getters.GET_ACTIVE_MEDIA_METADATA.ratingKey,
      machineIdentifier: getters.GET_ACTIVE_MEDIA_METADATA.machineIdentifier,
    }
    : null),

  GET_ADJUSTED_PLEX_CLIENT_POLL_DATA: (state, getters) => () => (getters.GET_PLEX_CLIENT_TIMELINE
    ? ({
      time: getters.GET_PLEX_CLIENT_TIMELINE.state === 'playing'
        ? getters.GET_PLEX_CLIENT_TIMELINE.time + Date.now()
          - getters.GET_PLEX_CLIENT_TIMELINE.receivedAt
        : getters.GET_PLEX_CLIENT_TIMELINE.time,
      duration: getters.GET_PLEX_CLIENT_TIMELINE.duration,
      state: getters.GET_PLEX_CLIENT_TIMELINE.state,
    })
    : null),

  GET_COMMAND_ID: (state) => state.commandId,

  GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID: (state) => state.previousSyncTimelineCommandId,

  // TODO: come back and reallly examine this logic
  ALREADY_SYNCED_ON_CURRENT_TIMELINE: (state, getters) => getters.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10'
  && ((getters.GET_PLEX_CLIENT_TIMELINE_COMMAND_ID === null
    && getters.GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID !== null)
    && getters.GET_PLEX_CLIENT_TIMELINE_COMMAND_ID
      <= getters.GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID),

  GET_PLEX_CLIENT_TIMELINE_COMMAND_ID: (state) => state.plexClientTimelineCommmandId,

  GET_ACTIVE_PLAY_QUEUE: (state) => state.activePlayQueue,

  GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER: (state) => state.activePlayQueueMachineIdentifier,

  GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: (state, getters) => (getters.GET_ACTIVE_PLAY_QUEUE
    ? getters.GET_ACTIVE_PLAY_QUEUE
      .Metadata[getters.GET_ACTIVE_PLAY_QUEUE.playQueueSelectedItemOffset]
    : null),

  ACTIVE_PLAY_QUEUE_NEXT_ITEM_EXISTS: (state, getters) => (getters.GET_ACTIVE_PLAY_QUEUE
    ? getters.GET_ACTIVE_PLAY_QUEUE.playQueueSelectedItemOffset
      < (getters.GET_ACTIVE_PLAY_QUEUE.size - 1)
    : false),

  ACTIVE_PLAY_QUEUE_PREVIOUS_ITEM_EXISTS: (state, getters) => (getters.GET_ACTIVE_PLAY_QUEUE
    ? getters.GET_ACTIVE_PLAY_QUEUE.playQueueSelectedItemOffset > 0
    : false),

  GET_CLIENT_POLLER_CANCELER: (state) => state.clientPollerCanceler,
};
