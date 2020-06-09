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
  username: null,

  clients: {},
  servers: {},

  itemCache: {},
  libraryCache: {},

  chosenClient: slPlayer,
  slPlayer,
});

export default state;
