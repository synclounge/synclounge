const state = () => ({
  socketId: null,
  server: null,
  room: null,
  password: null,
  users: {},
  hostId: null,
  messagesUserCache: {},
  messages: [],
  isPartyPausingEnabled: false,
  serversHealth: null,
  syncCancelToken: null,
  recentRooms: [],
  isInRoom: false,
  upnextTimeoutId: null,

  // This tracks whether the upnext screen was triggered for this playback already.
  // It is reset to false when the player gets out of the upNext time zone (at the end of episode)
  upNextTriggered: false,
  areNotificationsEnabled: false,
});

export default state;
