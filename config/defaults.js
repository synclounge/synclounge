const defaults = {
  port: 8088,
  base_url: '/',

  servers: [
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
  ],

  authentication: {
    mechanism: 'none',
  },

  default_slplayer_autoplay: true,
  default_slplayer_force_transcode: false,
  default_slplayer_volume: 1,
  default_client_poll_interval: 1000,
  default_sync_flexability: 3000,
  default_sync_mode: 'cleanseek',
};

module.exports = defaults;
