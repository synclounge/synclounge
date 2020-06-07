
export default {
  getServer: (state) => state.server,
  getMe: (state) => state.me,
  getRoom: (state) => state.room,
  getPassword: (state) => state.password,
  getUsers: (state) => state.users,
  getConnected: (state) => state.connected,
  getMessages: (state) => state.messages,
  getSocket: (state) => state.socket,
  getPartyPausing: (state) => state.partyPausing,
  getHostUser: (state) => state.users.find((u) => u.role === 'host'),
  GET_HOST_PLAYER_STATE: state => state.lastHostTimeline.playerState,
  AM_I_HOST: state => state.me.role === 'host',
};
