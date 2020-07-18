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
});

export default state;
