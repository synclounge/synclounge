const state = () => ({
  clients: {
    PTPLAYER9PLUS10: {
      provides: 'player',
      clientIdentifier: 'PTPLAYER9PLUS10',
      platform: 'Web',
      device: 'Web',
      product: 'SyncLounge',
      name: 'SyncLounge Player',
      labels: [['Recommended', 'green']],
      lastSeenAt: new Date().toISOString(),
    },
  },

  chosenClientId: 'PTPLAYER9PLUS10',
  activeMediaMetadata: null,
  activeServerId: null,

  // Timeline storage only for plex clients. For slplayer, we query its state directly
  plexClientTimeline: null,
  commandId: 0,

  // Tracks the commandId of the timeline that was used to synchronize last, so it doesn't try and synchronize
  // multiple times with the same data and instead waits for a fresh one
  previousSyncTimelineCommandId: null,
});

export default state;
