import { difference, intersection } from 'lodash-es';
import { makeUrl } from '@/utils/fetchutils';

export default {
  GET_PLEX_SERVERS: (state) => Object.values(state.servers),

  GET_PLEX_SERVER_IDS: (state) => Object.keys(state.servers),

  GET_PLEX_SERVER: (state) => (machineIdentifier) => state
    .servers[machineIdentifier],

  GET_UNBLOCKED_PLEX_SERVER_IDS: (state, getters, rootState, rootGetters) => difference(
    getters.GET_PLEX_SERVER_IDS,
    rootGetters['settings/GET_BLOCKEDSERVERS'],
  ),

  GET_CONNECTABLE_PLEX_SERVER_IDS: (state, getters) => getters.GET_PLEX_SERVER_IDS
    .filter((id) => state.servers[id].chosenConnection),

  IS_PLEX_SERVER_UNBLOCKED: (state, getters) => (machineIdentifier) => getters
    .GET_UNBLOCKED_PLEX_SERVER_IDS.includes(machineIdentifier),

  GET_LAST_SERVER_ID: (state) => state.lastServerId,
  GET_LAST_SERVER: (state, getters) => getters.GET_PLEX_SERVER(getters.GET_LAST_SERVER_ID),

  DOES_USER_HAVE_AUTHORIZED_SERVER: (state, getters, rootState, rootGetters) => rootGetters
    .GET_AUTHENTICATION.type
   && rootGetters.GET_AUTHENTICATION.type.includes('server')
  && intersection(
    getters.GET_PLEX_SERVER_IDS, rootGetters.GET_AUTHENTICATION.authorized,
  ).length > 0,

  GET_MEDIA_IMAGE_URL: (state, getters, rootState, rootGetters) => ({
    machineIdentifier, mediaUrl, width, height, blur,
  }) => {
    const server = getters.GET_PLEX_SERVER(machineIdentifier);

    const params = {
      ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](server.accessToken),
      url: mediaUrl,
      width: Math.round(width),
      height: Math.round(height),
      blur: blur || 0,
    };

    return makeUrl(`${server.chosenConnection.uri}/photo/:/transcode/`, params);
  },

  GET_BLOCKED_SERVER_IDS: (state) => state.blockedServerIds,
};
