import { detect } from 'detect-browser';
import { encodeUrlParams } from '@/utils/encoder';

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

const browser = detect();

export default {
  getItemCache: (state) => state.itemCache,
  getLibraryCache: (state) => state.libraryCache,
  GET_SL_PLAYER: (state) => state.slPlayer,
  GET_CHOSEN_CLIENT: (state) => state.clients[state.chosenClientId],
  GET_RECENT_PLEX_CLIENTS: (state) => Object.values(state.clients)
    .sort((a, b) => -a.lastSeenAt.localeCompare(b.lastSeenAt)),

  GET_LASTSERVER: (state, getters) => state.servers[getters['settings/GET_LASTSERVER']],
  GET_CONNECTABLE_PLEX_SERVERS: (state) => Object.values(state.servers).filter(
    (server) => server.chosenConnection,
  ),

  GET_PLEX_SERVERS: (state) => state.servers,

  IS_AUTHENTICATED: (state, getters, rootState, rootGetters) => !!rootGetters['settings/GET_PLEX_AUTH_TOKEN'] && getters.IS_USER_AUTHORIZED,

  GET_PLEX_PRODUCT_HEADER: () => 'SyncLounge',
  GET_PLEX_DEVICE_DEVICE_HEADER: () => browser.os,
  GET_PLEX_DEVICE_NAME_HEADER: () => capitalizeFirstLetter(browser.name),
  GET_PLEX_PLATFORM_HEADER: () => capitalizeFirstLetter(browser.name),

  GET_PLEX_INITIAL_AUTH_PARAMS: (state, getters, rootState, rootGetters) => ({
    'X-Plex-Product': getters.GET_PLEX_PRODUCT_HEADER,
    'X-Plex-Version': '4.34.3',
    'X-Plex-Client-Identifier': rootGetters['settings/GET_CLIENTIDENTIFIER'],
    'X-Plex-Platform': getters.GET_PLEX_PLATFORM_HEADER,
    'X-Plex-Platform-Version': browser.version,
    // 'X-Plex-Sync-Version': 2,
    // 'X-Plex-Features': 'external-media,indirect-media',
    'X-Plex-Model': 'hosted',
    'X-Plex-Device': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
    'X-Plex-Device-Name': getters.GET_PLEX_DEVICE_NAME_HEADER,
    'X-Plex-Device-Screen-Resolution': `${window.screen.availWidth}x${window.screen.availHeight},${window.screen.width}x${window.screen.height}`,
    'X-Plex-Language': 'en',
  }),

  GET_PLEX_BASE_PARAMS: (state, getters, rootState, rootGetters) => (accessToken) => ({
    ...getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    'X-Plex-Token': accessToken || rootGetters['settings/GET_PLEX_AUTH_TOKEN'],
  }),

  GET_PLEX_AUTH_URL: (state, getters, rootState, rootGetters) => (code) => {
    const urlParams = {
      'context[device][product]': getters.GET_PLEX_PRODUCT_HEADER,
      'context[device][environment]': 'bundled',
      'context[device][layout]': 'desktop',
      'context[device][platform]': getters.GET_PLEX_PLATFORM_HEADER,
      'context[device][device]': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
      clientID: rootGetters['settings/GET_CLIENTIDENTIFIER'],
      code,
    };

    return `https://app.plex.tv/auth#?${encodeUrlParams(urlParams)}`;
  },

  IS_DONE_FETCHING_DEVICES: (state) => state.doneFetchingDevices,
  GET_DEVICE_FETCH_PROMISE: (state) => state.deviceFetchPromise,
  GET_PLEX_USER: (state) => state.user,
  IS_USER_AUTHORIZED: (state) => state.userAuthorized,
};
