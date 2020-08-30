import stateFactory from './state';

export default {
  RESET: (state) => {
    Object.assign(state, stateFactory());
  },

  SET_ARE_DEVICES_CACHED: (state, cached) => {
    state.areDevicesCached = cached;
  },

  SET_DEVICE_FETCH_PROMISE: (state, promise) => {
    state.deviceFetchPromise = promise;
  },

  SET_PLEX_USER: (state, user) => {
    state.user = user;
  },

  SET_PLEX_AUTH_TOKEN: (state, token) => {
    state.plexAuthToken = token;
  },
};
