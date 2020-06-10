import guid from '@/utils/guid';

const state = () => ({
  appTitle: 'SyncLounge',
  appVersion: process.env.VUE_APP_VERSION,
  background: null,
  shownChat: false,
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  autoJoinUsername: null,
  extAvailable: false,
  lastRatingKey: null,
  manualSyncQueued: false,
  uuid: guid(),
  upNextCache: {},

  // SETTINGS
  stats: {},
  me: {},
  isLeftSidebarOpen: false,
  isRightSidebarOpen: false,

  // This tracks whether the upnext screen was triggered for this playback already.
  // It is reset to false when the player gets out of the upNext time zone (at the end of episode)
  upNextTriggered: false,

  // This stores the postplay data and controls whether the upnext component is visible
  upNextPostPlayData: null,

  plexServerId: null,
});

export default state;
