// Custom Servers list settings
const defaultSyncloungeServers = [
  {
    name: 'SyncLounge AU1',
    location: 'Sydney, Australia',
    url: 'https://v3au1.synclounge.tv/slserver',
    image: 'flags/au.png',
  },
  {
    name: 'SyncLounge EU1',
    location: 'Amsterdam, Netherlands',
    url: 'https://v2eu1.synclounge.tv/server',
    image: 'flags/eu.png',
  },
  {
    name: 'SyncLounge US1',
    location: 'Miami, United States',
    url: 'https://v2us1.synclounge.tv/server',
    image: 'flags/us.png',
  },
  {
    name: 'SyncLounge US2',
    location: 'Miami, United States',
    url: 'https://v3us1.synclounge.tv/slserver',
    image: 'flags/us.png',
  },
  {
    name: 'SyncLounge US3',
    location: 'Miami, United States',
    url: 'https://v3us2.synclounge.tv/slserver',
    image: 'flags/us.png',
  },
];

export default {
  getAppVersion: (state) => state.appVersion,
  getPlex: (state) => state.plex,
  getBackground: (state) => state.background,
  getChosenClient: (state) => state.chosenClient,
  getShownChat: (state) => state.shownChat,
  getStats: (state) => state.stats,
  getBlockAutoPlay: (state) => state.blockAutoPlay,
  getAutoJoin: (state) => state.autoJoin,
  getAutoJoinRoom: (state) => state.autoJoinRoom,
  getAutoJoinPassword: (state) => state.autoJoinPassword,
  getAutoJoinUrl: (state) => state.autoJoinUrl,
  getShortLink: (state) => state.shortLink,

  // SETTINGS
  getExtAvailable: (state) => state.extAvailable,
  getLogos: () => ({
    light: {
      long: 'logo-long-light.png',
      small: 'logo-small-light.png',
    },
    dark: {
      long: 'logo-long-dark.png',
    },
    plex: {
      standard: 'plexlogo.png',
    },
  }),

  GET_SYNCLOUNGE_SERVERS: (state, getters) => {
    if (getters['config/GET_CONFIG'].servers && getters['config/GET_CONFIG'].servers.length > 0) {
      if (getters['config/GET_CONFIG'].customServer) {
        console.error(
          "'customServer' setting provided with 'servers' setting. Ignoring 'customServer' setting.",
        );
      }
      return getters['config/GET_CONFIG'].servers;
    }

    if (getters['config/GET_CONFIG'].customServer) {
      return defaultSyncloungeServers.concat([getters['config/GET_CONFIG'].customServer]);
    }

    return defaultSyncloungeServers.concat([getters['settings/GET_CUSTOMSERVER']]);
  },
  GET_MANUAL_SYNC_QUEUED: (state) => state.manualSyncQueued,
  GET_ME: (state) => state.me,

  GET_UP_NEXT_TRIGGERED: (state) => state.upNextTriggered,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_PLEX_SERVER_ID: (state) => state.plexServerId,
};
