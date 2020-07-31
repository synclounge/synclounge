import { detect } from 'detect-browser';
import { intersection } from '@/utils/lightlodash';
import { makeUrl } from '@/utils/fetchutils';

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

const browser = detect();

const plexDeviceName = () => {
  switch (browser.name) {
    case 'edge-chromium': {
      // Plex doesn't like edge-chromium device name, so send it what plex web does
      return 'Microsoft Edge';
    }

    default: {
      return capitalizeFirstLetter(browser.name);
    }
  }
};

export default {
  IS_AUTHENTICATED: (state, getters) => !!getters.GET_PLEX_AUTH_TOKEN
    && getters.IS_USER_AUTHORIZED,

  GET_PLEX_PRODUCT_HEADER: () => 'SyncLounge',
  GET_PLEX_DEVICE_DEVICE_HEADER: () => browser.os,
  GET_PLEX_DEVICE_NAME_HEADER: () => plexDeviceName(),
  GET_PLEX_PLATFORM_HEADER: () => plexDeviceName(),
  GET_PLEX_DEVICE_SCREEN_RESOLUTION_HEADER: () => `${window.screen.availWidth}x${window.screen.availHeight},${window.screen.width}x${window.screen.height}`,

  GET_PLEX_INITIAL_AUTH_PARAMS: (state, getters) => ({
    'X-Plex-Product': getters.GET_PLEX_PRODUCT_HEADER,
    'X-Plex-Version': process.env.VUE_APP_VERSION,
    'X-Plex-Client-Identifier': getters.GET_CLIENT_IDENTIFIER,
    'X-Plex-Platform': getters.GET_PLEX_PLATFORM_HEADER,
    'X-Plex-Platform-Version': browser.version,
    // 'X-Plex-Sync-Version': 2,
    'X-Plex-Features': 'external-media,indirect-media',
    'X-Plex-Model': 'hosted',
    'X-Plex-Device': getters.GET_PLEX_DEVICE_DEVICE_HEADER,
    'X-Plex-Device-Name': getters.GET_PLEX_DEVICE_NAME_HEADER,
    'X-Plex-Device-Screen-Resolution': getters.GET_PLEX_DEVICE_SCREEN_RESOLUTION_HEADER,
    'X-Plex-Language': 'en',
  }),

  GET_PLEX_BASE_PARAMS: (state, getters) => (accessToken) => ({
    ...getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    'X-Plex-Token': accessToken || getters.GET_PLEX_AUTH_TOKEN,
    'X-Plex-Text-Format': 'plain',
    'X-Plex-Provider-Version': 1.3,
  }),

  GET_PLEX_AUTH_URL: (state, getters) => (code) => {
    const urlParams = {
      'context[device][product]': getters.GET_PLEX_PRODUCT_HEADER,
      'context[device][version]': process.env.VUE_APP_VERSION,
      'context[device][platform]': getters.GET_PLEX_PLATFORM_HEADER,
      'context[device][platformVersion]': browser.version,
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

  IS_DONE_FETCHING_DEVICES: (state) => state.doneFetchingDevices,
  GET_DEVICE_FETCH_PROMISE: (state) => state.deviceFetchPromise,
  GET_PLEX_USER: (state) => state.user,

  IS_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => getters
    .IS_AUTHENTICATION_TYPE_NONE
    || rootGetters['plexservers/DOES_USER_HAVE_AUTHORIZED_SERVER']
    || getters.IS_PLEX_USER_AUTHORIZED,

  IS_PLEX_USER_AUTHORIZED: (state, getters, rootState, rootGetters) => rootGetters
    .GET_CONFIG?.authentication?.type.includes('user')
    && intersection(
      [getters.GET_PLEX_USER.username, getters.GET_PLEX_USER.email],
      rootGetters.GET_AUTHENTICATION.authorized,
    ).length > 0,

  IS_AUTHENTICATION_TYPE_NONE: (state, getters, rootState, rootGetters) => rootGetters
    .GET_CONFIG?.authentication.mechanism === 'none',

  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
  GET_CLIENT_IDENTIFIER: (state) => state.clientIdentifier,
};
