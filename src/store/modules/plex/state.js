import PlexClient from './helpers/PlexClient';


const slPlayer = new PlexClient({
  provides: 'player',
  clientIdentifier: 'PTPLAYER9PLUS10',
  platform: 'Web',
  device: 'Web',
  product: 'SyncLounge',
  name: 'SyncLounge Player',
  labels: [['Recommended', 'green']],
  lastSeenAt: new Date().toISOString(),
});

const state = () => ({
  clients: {
    PTPLAYER9PLUS10: slPlayer,
  },

  servers: {},
  user: null,

  doneFetchingDevices: false,
  deviceFetchPromise: null,
  userAuthorized: null,

  itemCache: {},
  libraryCache: {},

  chosenClientId: 'PTPLAYER9PLUS10',
});

export default state;
