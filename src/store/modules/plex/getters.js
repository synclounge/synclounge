import { detect } from 'detect-browser';
import { encodeUrlParams } from '@/utils/encoder';

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

const browser = detect();

export default {
  getItemCache: (state) => state.itemCache,
  getLibraryCache: (state) => state.libraryCache,
  recentClients: (state) => {
    let clients = Object.values(state.clients);
    clients = clients.sort((a, b) => parseInt(b.lastSeenAt, 10) - parseInt(a.lastSeenAt, 10));
    return clients;
  },
  GET_LASTSERVER: (state, getters) => state.servers[getters['settings/GET_LASTSERVER']],
  GET_VALID_SERVERS: (state) => Object.fromEntries(
    Object.entries(state.servers).filter(
      ([, server]) => server.chosenConnection,
    ),
  ),

  IS_AUTHENTICATED: (state, getters, rootState, rootGetters) => !!rootGetters['settings/GET_PLEX_AUTH_TOKEN'],

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

  GET_PLEX_BASE_PARAMS: (state, getters, rootState, rootGetters) => ({
    ...getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    'X-Plex-Token': rootGetters['settings/GET_PLEX_AUTH_TOKEN'],
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
};
