import { intersection } from '@/utils/lightlodash';
import { makeUrl } from '@/utils/fetchutils';

const capitalizeFirstLetter = (string) => string[0].toUpperCase() + string.slice(1);

export default {
  IS_UNAUTHORIZED: (state, getters) => !getters.GET_PLEX_AUTH_TOKEN
    || (getters.ARE_DEVICES_CACHED && !getters.IS_USER_AUTHORIZED),

  GET_PLEX_DEVICE_NAME: (state, getters, rootState, rootGetters) => {
    switch (rootGetters.GET_BROWSER.name) {
      case 'edge-chromium': {
      // Plex doesn't like edge-chromium device name, so send it what plex web does
        return 'Microsoft Edge';
      }

      default: {
        return capitalizeFirstLetter(rootGetters.GET_BROWSER.name);
      }
    }
  },

  GET_PLEX_PRODUCT_HEADER: () => 'SyncLounge',
  GET_PLEX_DEVICE_DEVICE_HEADER: (state, getters, rootState, rootGetters) => rootGetters
    .GET_BROWSER.os,

  GET_PLEX_DEVICE_NAME_HEADER: (state, getters) => getters.GET_PLEX_DEVICE_NAME,
  GET_PLEX_PLATFORM_HEADER: (state, getters) => getters.GET_PLEX_DEVICE_NAME,
  GET_PLEX_DEVICE_SCREEN_RESOLUTION_HEADER: () => `${window.screen.availWidth}x${
    window.screen.availHeight},${window.screen.width}x${window.screen.height}`,

  GET_PLEX_INITIAL_AUTH_PARAMS: (state, getters, rootState, rootGetters) => ({
    'X-Plex-Product': getters.GET_PLEX_PRODUCT_HEADER,
    'X-Plex-Version': rootState.version,
    'X-Plex-Client-Identifier': getters.GET_CLIENT_IDENTIFIER,
    'X-Plex-Platform': getters.GET_PLEX_PLATFORM_HEADER,
    'X-Plex-Platform-Version': rootGetters.GET_BROWSER.version,
    // 'X-Plex-Sync-Version': 2,
    'X-Plex-Features': 'external-media,indirect-media',
    'X-Plex-Model': 'hosted',
    'X-Plex-Device': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
    'X-Plex-Device-Name': getters.GET_PLEX_DEVICE_NAME_HEADER,
    'X-Plex-Device-Screen-Resolution': getters.GET_PLEX_DEVICE_SCREEN_RESOLUTION_HEADER,
    'X-Plex-Language': 'en',
  }),

  GET_PLEX_TOKEN_PARAMS: (state, getters) => (accessToken) => ({
    'X-Plex-Token': accessToken || getters.GET_PLEX_AUTH_TOKEN,
  }),

  GET_PLEX_BASE_PARAMS: (state, getters) => (accessToken) => ({
    ...getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    ...getters.GET_PLEX_TOKEN_PARAMS(accessToken),
    'X-Plex-Text-Format': 'plain',
    'X-Plex-Provider-Version': 1.3,
  }),

  GET_PLEX_AUTH_URL: (state, getters, rootState, rootGetters) => (code) => {
    const urlParams = {
      'context[device][product]': getters.GET_PLEX_PRODUCT_HEADER,
      'context[device][version]': rootState.version,
      'context[device][platform]': getters.GET_PLEX_PLATFORM_HEADER,
      'context[device][platformVersion]': rootGetters.GET_BROWSER.version,
      'context[device][device]': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
      'context[device][name]': getters.GET_PLEX_DEVICE_NAME_HEADER,
      'context[device][model]': 'hosted',
      'context[device][screenResolution]': getters.GET_PLEX_DEVICE_SCREEN_RESOLUTION_HEADER,
      'context[device][environment]': 'bundled',
      'context[device][layout]': 'desktop',
      clientID: getters.GET_CLIENT_IDENTIFIER,
      code,
    };

    return makeUrl('https://app.plex.tv/auth#', urlParams);
  },

  ARE_DEVICES_CACHED: (state) => state.areDevicesCached,
  GET_DEVICE_FETCH_PROMISE: (state) => state.deviceFetchPromise,
  GET_PLEX_USER: (state) => state.user,

  IS_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => getters
    .IS_AUTHENTICATION_TYPE_NONE
    || rootGetters['plexservers/DOES_USER_HAVE_AUTHORIZED_SERVER']
    || getters.IS_PLEX_USER_AUTHORIZED,

  IS_PLEX_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => rootGetters
    .GET_CONFIG?.authentication?.type.includes('user')
    && getters.GET_PLEX_USER
    && intersection([
      [getters.GET_PLEX_USER.username, getters.GET_PLEX_USER.email],
      rootGetters.GET_CONFIG.authentication.authorized,
    ]).length > 0,

  IS_AUTHENTICATION_TYPE_NONE: (state, getters, rootState, rootGetters) => rootGetters
    .GET_CONFIG?.authentication.mechanism === 'none',

  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
  GET_CLIENT_IDENTIFIER: (state) => state.clientIdentifier,
};
