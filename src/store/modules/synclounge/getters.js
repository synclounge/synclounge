import defaultSyncloungeServers from './defaultservers';

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
  GET_ME: (state, getters) => getters.GET_USERS.find((u) => u.uuid === getters.GET_UUID),
  GET_ROOM: (state) => state.room,
  getPassword: (state) => state.password,
  GET_USERS: (state) => state.users,
  GET_MESSAGES: (state) => state.messages,
  getPartyPausing: (state) => state.partyPausing,
  GET_HOST_USER: (state, getters) => getters.GET_USERS.find((u) => u.role === 'host'),
  GET_HOST_PLAYER_STATE: (state) => state.lastHostTimeline.playerState,
  AM_I_HOST: (state, getters) => getters.GET_ME && getters.GET_ME.role === 'host',

  GET_SYNCLOUNGE_SERVERS: (state, getters, rootState, rootGetters) => {
    if (rootGetters.GET_CONFIG.servers && rootGetters.GET_CONFIG.servers.length > 0) {
      if (rootGetters.GET_CONFIG.customServer) {
        console.error(
          "'customServer' setting provided with 'servers' setting. Ignoring 'customServer' setting.",
        );
      }
      return rootGetters.GET_CONFIG.servers;
    }

    if (rootGetters.GET_CONFIG.customServer) {
      return defaultSyncloungeServers.concat([rootGetters.GET_CONFIG.customServer]);
    }

    return defaultSyncloungeServers.concat([rootGetters['settings/GET_CUSTOMSERVER']]);
  },

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
};
