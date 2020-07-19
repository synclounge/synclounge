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
  GET_MESSAGES_USER_CACHE_USER: (state) => (id) => state.messagesUserCache[id],
  GET_USER: (state, getters) => (id) => getters.GET_USERS[id],
  GET_SOCKET_ID: (state) => state.socketId,
  GET_HOST_ID: (state) => state.hostId,
  GET_ROOM: (state) => state.room,
  GET_USERS: (state) => state.users,
  GET_MESSAGES: (state) => state.messages,
  IS_PARTY_PAUSING_ENABLED: (state) => state.isPartyPausingEnabled,
  GET_HOST_USER: (state, getters) => getters.GET_USER(getters.GET_HOST_ID),
  AM_I_HOST: (state, getters) => getters.GET_HOST_ID === getters.GET_SOCKET_ID,

  GET_SYNCLOUNGE_SERVERS: (state, getters, rootState, rootGetters) => (
    rootGetters.GET_CONFIG.customServer
      ? rootGetters.GET_CONFIG.servers.concat([rootGetters.GET_CONFIG.customServer])
      : rootGetters.GET_CONFIG.servers),

  GET_SERVERS_HEALTH: (state) => state.serversHealth,

  GET_SERVER_HEALTH: (state) => (url) => state.serversHealth[url],

  GET_SERVER_HEALTH_SCORES: (state, getters) => (getters.GET_SERVERS_HEALTH
    ? Object.fromEntries(Object.entries(getters.GET_SERVERS_HEALTH).map(([url, health]) => [
      url,
      healthScore(health),
    ]))
    : null),

  GET_BEST_SERVER: (state, getters) => (getters.GET_SERVER_HEALTH_SCORES
    ? Object.entries(getters.GET_SERVER_HEALTH_SCORES)
      .reduce((prev, curr) => (curr[1] < prev[1] ? curr : prev))[0]
    : null),

  GET_DISPLAY_USERNAME: (state, getters, rootState, rootGetters) => (rootGetters['settings/GET_HIDEUSERNAME']
    ? rootGetters['settings/GET_ALTUSERNAME']
    : rootGetters['plex/GET_PLEX_USER'].username || rootGetters['plex/GET_PLEX_USER'].title),

  GET_SYNC_STATE: (state, getters, rootState, rootGetters) => (clientTime) => {
    if (!getters.GET_HOST_USER) {
      return 'unknown';
    }

    if (getters.AM_I_HOST) {
      return 'synced';
    }

    const difference = Math.abs(clientTime - getters.GET_ADJUSTED_HOST_TIME());

    return difference > rootGetters['settings/GET_SYNCFLEXIBILITY']
      ? 'unsynced'
      : 'synced';
  },

  GET_SERVER: (state) => state.server,

  GET_SYNC_CANCEL_TOKEN: (state) => state.syncCancelToken,

  GET_RECENT_ROOMS: (state) => state.recentRooms,

  GET_PASSWORD: (state) => state.password,

  IS_IN_ROOM: (state) => state.isInRoom,

  // Note: the host should really always have a playback rate of 1
  // eslint-disable-next-line no-nested-ternary
  GET_ADJUSTED_HOST_TIME: (state, getters) => () => (getters.GET_HOST_USER
    ? getters.GET_HOST_USER.state === 'playing'
      ? getters.GET_HOST_USER.time + (Date.now()
          - getters.GET_HOST_USER.updatedAt) * getters.GET_HOST_USER.playbackRate
      : getters.GET_HOST_USER.time
    : null),
};
