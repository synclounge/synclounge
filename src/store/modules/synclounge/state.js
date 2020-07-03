const state = () => ({
  socket: null,
  socketId: null,
  server: null,
  room: null,
  password: null,
  users: {},
  messages: [],
  partyPausing: false,
  hostTimeline: null,
  hostLastRatingKey: null,
  rawTitle: null,
  serversHealth: null,

  // This is used to calculate RTT between us and synclounge server
  // It is a map between poll number and time sent
  unackedPolls: {},
  pollNumber: 0,

  // Smoothed round trip time
  srtt: null,
  isSyncInProgress: false,
  isManualSyncedQueued: false,
  recentRooms: [],
  isSocketConnected: false,
  clientPollerCanceler: null,

  isInRoom: false,
});

export default state;
