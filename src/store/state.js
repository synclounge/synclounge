import { generateGuid } from '@/utils/helpers';

const state = () => ({
  appTitle: 'SyncLounge',
  appVersion: process.env.npm_package_version,
  background: null,
  shownChat: false,
  chosenClient: null,
  chosenClientTimeSet: new Date().getTime(),
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  autoJoinUsername: null,
  shortLink: null,
  extAvailable: false,
  lastRatingKey: null,
  manualSyncQueued: false,
  uuid: generateGuid(),
  upNextCache: {},

  // SETTINGS
  stats: {},
  me: {},
  isLeftSidebarOpen: false,
  isRightSidebarOpen: false,
});

export default state;
