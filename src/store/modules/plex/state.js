import { v4 as uuidv4 } from 'uuid';

const state = () => ({
  user: null,
  doneFetchingDevices: false,
  deviceFetchPromise: null,
  plexAuthToken: null,
  clientIdentifier: uuidv4(),
});

export default state;
