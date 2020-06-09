const state = () => ({
  socket: null,
  ptservers: [],
  connected: false,
  server: false,
  room: false,
  password: false,
  users: [],
  messages: [],
  partyPausing: false,
  me: '',
  decisionBlockedTime: 0,
  lastHostTimeline: {},
  commands: {},
  rawTitle: null,
  serversHealth: null,
});


export default state;
