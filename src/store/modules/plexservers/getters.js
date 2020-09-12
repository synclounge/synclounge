import { difference, intersection } from '@/utils/lightlodash';
import { makeUrl } from '@/utils/fetchutils';

export default {
  GET_PLEX_SERVERS: (state) => Object.values(state.servers),

  GET_PLEX_SERVER_IDS: (state) => Object.keys(state.servers),

  GET_PLEX_SERVER: (state) => (machineIdentifier) => state
    .servers[machineIdentifier],

  GET_UNBLOCKED_PLEX_SERVER_IDS: (state, getters) => difference([
    getters.GET_PLEX_SERVER_IDS,
    getters.GET_BLOCKED_SERVER_IDS,
  ]),

  GET_CONNECTABLE_PLEX_SERVER_IDS: (state, getters) => getters.GET_PLEX_SERVER_IDS
    .filter((id) => state.servers[id].chosenConnection),

  IS_PLEX_SERVER_UNBLOCKED: (state, getters) => (machineIdentifier) => getters
    .GET_UNBLOCKED_PLEX_SERVER_IDS.includes(machineIdentifier),

  GET_LAST_SERVER_ID: (state) => state.lastServerId,
  GET_LAST_SERVER: (state, getters) => getters.GET_PLEX_SERVER(getters.GET_LAST_SERVER_ID),

  DOES_USER_HAVE_AUTHORIZED_SERVER: (state, getters, rootState, rootGetters) => rootGetters
    .GET_CONFIG?.authentication?.type.includes('server')
  && intersection([
    getters.GET_PLEX_SERVER_IDS,
    rootGetters.GET_CONFIG.authentication.authorized,
  ]).length > 0,

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
      upscale: 1,
      minSize: 1,
    };

    return makeUrl(`${server.chosenConnection.uri}/photo/:/transcode/`, params);
  },

  GET_MEDIA_BACKGROUND_URL: (state, getters) => (
    { machineIdentifier, art, thumb },
  ) => getters.GET_MEDIA_IMAGE_URL({
    machineIdentifier,
    mediaUrl: art || thumb,
    width: window.screen.width,
    height: window.screen.height,
    blur: 10,
  }),

  GET_BLOCKED_SERVER_IDS: (state) => state.blockedServerIds,

  GET_SERVER_LIBRARY_SIZE: (state, getters) => ({ machineIdentifier, sectionId }) => getters
    .GET_PLEX_SERVER(machineIdentifier).libraries[sectionId].size,

  GET_SERVER_LIBRARY_SIZES: (state, getters) => (machineIdentifier) => Object.fromEntries(
    Object.keys(getters.GET_PLEX_SERVER(machineIdentifier).libraries).map(
      (sectionId) => [
        sectionId,
        getters.GET_SERVER_LIBRARY_SIZE({ machineIdentifier, sectionId }),
      ],
    ),
  ),

  GET_SERVER_SIZE: (state, getters) => (machineIdentifier) => Object.values(
    getters.GET_SERVER_LIBRARY_SIZES(machineIdentifier),
  ).reduce((a, b) => a + b, 0),

  GET_CONNECTABLE_SERVER_SIZES: (state, getters) => Object.fromEntries(
    getters.GET_CONNECTABLE_PLEX_SERVER_IDS.map(
      (machineIdentifier) => [
        machineIdentifier,
        getters.GET_SERVER_SIZE(machineIdentifier),
      ],
    ),
  ),
};
