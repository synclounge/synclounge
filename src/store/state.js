import { detect } from 'detect-browser';

const state = () => ({
  version: process.env.VUE_APP_VERSION,
  gitHash: process.env.VUE_APP_GIT_HASH,
  repositoryUrl: 'https://github.com/synclounge/synclounge',
  discordUrl: 'https://discord.gg/fKQB3yt',

  background: null,
  configuration: null,

  isLeftSidebarOpen: false,
  isRightSidebarOpen: true,

  // This stores the postplay data and controls whether the upnext component is visible
  upNextPostPlayData: null,

  // Used to help with the crumbs
  activeMetadata: null,

  snackbarMessage: {},
  snackbarOpen: false,
  navigateToPlayer: false,
  browser: detect(),
  navigateHome: false,
  isLibraryListView: false,
});

export default state;
