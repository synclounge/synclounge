const state = () => ({
  user: null,

  doneFetchingDevices: false,
  deviceFetchPromise: null,

  itemCache: {},
  libraryCache: {},
});

export default state;
