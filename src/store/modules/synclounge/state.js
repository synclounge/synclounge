const state = () => ({
  socketId: null,
  server: null,
  room: null,
  password: null,
  users: {},
  hostId: null,
  messagesUserCache: {},
  messages: [],
  partyPausing: false,
  serversHealth: null,
  isSyncInProgress: false,
  isManualSyncedQueued: false,
  recentRooms: [],

  isInRoom: false,
});

export default state;
