export default {
  getAppVersion: (state) => state.appVersion,
  getPlex: (state) => state.plex,
  getBackground: (state) => state.background,
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


  GET_MANUAL_SYNC_QUEUED: (state) => state.manualSyncQueued,
  GET_ME: (state) => state.me,

  GET_UP_NEXT_TRIGGERED: (state) => state.upNextTriggered,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_PLEX_SERVER_ID: (state) => state.plexServerId,
};
