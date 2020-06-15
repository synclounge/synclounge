import PlexClient from '@/store/modules/plex/helpers/PlexClient';

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

  chosenClientId: 'PTPLAYER9PLUS10',
  clientPlayingMetadata: null,
});

export default state;
