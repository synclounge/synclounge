import guid from '@/utils/guid';

const state = () => ({
  user: null,
  doneFetchingDevices: false,
  deviceFetchPromise: null,
  plexAuthToken: null,
  clientIdentifier: guid(),
});

export default state;
