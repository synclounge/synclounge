const defaults = {
  servers: [
    {
      name: 'Local Server',
      location: 'Local',
      url: '',
      image: 'synclounge-white.png',
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
  default_auto_skip_intro: false,

  slplayer_plex_timeline_update_interval: 10000,
  slplayer_controls_visible_checker_interval: 250,
  slplayer_initial_skip_intro_visible_period: 8000,

  // Controlls the max time difference cutoff for syncing by changing the playback speed
  slplayer_speed_sync_max_diff: 10000,

  // The playback rate (1 +/- rate) that is used when speed syncing
  slplayer_speed_sync_rate: 0.5,
  slplayer_seek_timeout: 15000,

  // Buffering goal in seconds
  slplayer_buffering_goal: 120,
  slplayer_soft_seek_threshold: 200,
  sidebar_time_update_interval: 500,

  // If the plex client's time changes by this much from the expected time, trigger a state change
  plex_client_time_delta_state_change_threshold: 500,
  plex_auth_check_interval: 1000,

  socket_server_health_timeout: 2000,
  synclounge_max_recent_room_history: 100,

  // TODO: investigate the average length of closing credits
  synclounge_upnext_trigger_time_from_end: 45000,
  synclounge_upnext_popup_lifetime: 60000,

  default_party_pause_enabled: true,
  default_auto_host_enabled: true,

  force_slplayer: false,

  // Skip ahead time in ms
  skip_ahead_time: 10000,

  // Sync flexibility when players are paused
  paused_sync_flexibility: 10,
};

module.exports = defaults;
