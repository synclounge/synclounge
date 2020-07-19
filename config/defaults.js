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

  slplayer_plex_timeline_update_interval: 10000,
  slplayer_controls_visible_checker_interval: 500,

  // Controlls the max time difference cutoff for syncing by changing the playback speed
  slplayer_speed_sync_max_diff: 10000,

  // The playback rate (1 +/- rate) that is used when speed syncing
  slplayer_speed_sync_rate: 0.5,
  sidebar_time_update_interval: 500,

  // If the plex client's time changes by this much from the expected time, trigger a state change
  plex_client_time_delta_state_change_threshold: 500,
  plex_auth_check_interval: 1000,

  socket_server_health_timeout: 2000,
};

module.exports = defaults;
