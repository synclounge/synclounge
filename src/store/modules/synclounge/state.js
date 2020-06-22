import guid from '@/utils/guid';

const state = () => ({
  uuid: guid(),
  socket: null,
  server: null,
  room: null,
  password: false,
  users: [],
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
});

export default state;
