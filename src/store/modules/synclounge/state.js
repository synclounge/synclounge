import guid from '@/utils/guid';

const state = () => ({
  uuid: guid(),
  socket: null,
  room: null,
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
