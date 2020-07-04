const loadToNumber = (load) => {
  switch (load) {
    case 'low':
      return 1;

    case 'medium':
      return 2;

    case 'high':
      return 3;

    default:
      // A really big number since this shouldn't happen
      return 1000;
  }
};

const healthScore = (health) => health.latency + loadToNumber(health.load) * 10;

export default {
  GET_USER: (state, getters) => (id) => getters.GET_USERS[id],
  GET_ME: (state, getters) => getters.GET_USERS[getters.GET_SOCKET_ID],
  GET_SOCKET_ID: (state) => state.socketId,
  GET_ROOM: (state) => state.room,
  getPassword: (state) => state.password,
  GET_USERS: (state) => state.users,
  GET_MESSAGES: (state) => state.messages,
  getPartyPausing: (state) => state.partyPausing,
  GET_HOST_USER: (state, getters) => Object.values(getters.GET_USERS).find((u) => u.isHost),
  AM_I_HOST: (state, getters) => getters.GET_ME && getters.GET_ME.isHost,

  GET_SYNCLOUNGE_SERVERS: (state, getters, rootState, rootGetters) => (
    rootGetters.GET_CONFIG.customServer
      ? rootGetters.GET_CONFIG.servers.concat([rootGetters.GET_CONFIG.customServer])
      : rootGetters.GET_CONFIG.servers),

  GET_SERVERS_HEALTH: (state) => state.serversHealth,

  GET_SERVER_HEALTH_SCORES: (state, getters) => (getters.GET_SERVERS_HEALTH
    ? getters.GET_SERVERS_HEALTH.map((health) => ({
      score: healthScore(health),
      url: health.url,
    }))
    : null),

  GET_BEST_SERVER: (state, getters) => (getters.GET_SERVER_HEALTH_SCORES
    ? getters.GET_SERVER_HEALTH_SCORES
      .reduce((prev, curr) => (curr.score < prev.score ? curr : prev)).url
    : null),

  GET_SOCKET: (state) => state.socket,

  GET_DISPLAY_USERNAME: (state, getters, rootState, rootGetters) => (rootGetters['settings/GET_HIDEUSERNAME']
    ? rootGetters['settings/GET_ALTUSERNAME']
    : rootGetters['plex/GET_PLEX_USER'].username || rootGetters['plex/GET_PLEX_USER'].title),

  GET_UUID: (state) => state.uuid,

  GET_HOST_TIMELINE: (state) => state.hostTimeline,

  // Gets the host's player time adjusted based on how long it's been since we got the message
  GET_HOST_PLAYER_TIME_ADJUSTED: (state, getters) => () => {
    const hostAge = Date.now() - getters.GET_HOST_TIMELINE.receivedAt;

    // TODO: please veyr much examine the latency and maybe see if the server should calc
    return getters.GET_HOST_TIMELINE.state === 'playing'
      ? getters.GET_HOST_TIMELINE.time + hostAge
        + (getters.GET_HOST_TIMELINE.latency || 0)
        + (getters.GET_HOST_TIMELINE.srttSnapsnotAtReception || 0) / 2
      : getters.GET_HOST_TIMELINE.time;
  },

  GET_STATUS: (state, getters, rootState, rootGetters) => (clientTime) => {
    if (!getters.GET_HOST_TIMELINE || Number.isNaN(getters.GET_HOST_TIMELINE.time)) {
      return 'error';
    }

    const difference = Math.abs(clientTime - getters.GET_HOST_PLAYER_TIME_ADJUSTED());

    if (difference > rootGetters['settings/GET_SYNCFLEXIBILITY']) {
      return 'notok';
    }

    return 'good';
  },

  GET_POLL_NUMBER: (state) => state.pollNumber,

  GET_SRTT: (state) => state.srtt,

  GET_POLL_SENT_TIME: (state) => (pollNumber) => state.unackedPolls[pollNumber],

  GET_SERVER: (state) => state.server,

  // Used to detect if the host changes
  GET_HOST_LAST_RATING_KEY: (state) => state.hostLastRatingKey,

  IS_SYNC_IN_PROGRESS: (state) => state.isSyncInProgress,

  IS_MANUAL_SYNC_QUEUED: (state) => state.isManualSyncedQueued,

  GET_RECENT_ROOMS: (state) => state.recentRooms,

  GET_PASSWORD: (state) => state.password,

  GET_CLIENT_POLLER_CANCELER: (state) => state.clientPollerCanceler,

  IS_IN_ROOM: (state) => state.isInRoom,
};
