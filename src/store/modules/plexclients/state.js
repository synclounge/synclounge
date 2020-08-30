import { slPlayerClientId } from '@/player/constants';

const state = () => ({
  clients: {
    [slPlayerClientId]: {
      provides: 'player',
      clientIdentifier: slPlayerClientId,
      platform: 'Web',
      device: 'Web',
      product: 'SyncLounge',
      name: 'SyncLounge Player',
      labels: [['Recommended', 'green']],
      lastSeenAt: new Date().toISOString(),
    },
  },

  chosenClientId: slPlayerClientId,
  activeMediaMetadata: null,
  activeServerId: null,
  activePlayQueue: null,
  activePlayQueueMachineIdentifier: null,

  // Timeline storage only for plex clients. For slplayer, we query its state directly
  plexClientTimeline: null,
  plexClientTimelineCommmandId: null,
  commandId: 0,

  // Tracks the commandId of the timeline that was used to synchronize last, so it doesn't try and
  // synchronize multiple times with the same data and instead waits for a fresh one
  previousSyncTimelineCommandId: null,
  clientPollerCancelToken: null,
  lastPlayMediaCommandId: null,
  latency: 0,
});

export default state;
