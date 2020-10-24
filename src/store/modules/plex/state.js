import { getRandomPlexId } from '@/utils/random';

const state = () => ({
  user: null,
  areDevicesCached: false,
  deviceFetchPromise: null,
  plexAuthToken: null,
  clientIdentifier: getRandomPlexId(),
});

export default state;
