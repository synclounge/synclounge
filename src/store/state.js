import { detect } from 'detect-browser';

const state = () => ({
  background: null,
  configuration: null,
  configurationPromise: null,

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
});

export default state;
