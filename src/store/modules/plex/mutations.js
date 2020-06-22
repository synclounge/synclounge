export default {
  SET_DONE_FETCHING_DEVICES: (state, done) => {
    state.doneFetchingDevices = done;
  },

  SET_DEVICE_FETCH_PROMISE: (state, promise) => {
    state.deviceFetchPromise = promise;
  },

  SET_PLEX_USER: (state, user) => {
    state.user = user;
  },
};
