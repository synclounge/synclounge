import { detect } from 'detect-browser';

const state = () => ({
  version: process.env.VUE_APP_VERSION,
  gitHash: process.env.VUE_APP_GIT_HASH,
  repositoryUrl: 'https://github.com/ttshivers/synclounge',
  discordUrl: 'https://discord.gg/fKQB3yt',

  background: null,
  configuration: null,

  isLeftSidebarOpen: false,
  isRightSidebarOpen: false,

  // This stores the postplay data and controls whether the upnext component is visible
  upNextPostPlayData: null,

  // Used to help with the crumbs
  activeMetadata: null,

  snackbarMessage: null,
  snackbarOpen: false,
  navigateToPlayer: false,
  browser: detect(),
  navigateHome: false,
});

export default state;
