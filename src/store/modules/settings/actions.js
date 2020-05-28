export default {
  ADD_RECENT_ROOM: ({ commit, getters }, newRoom) => commit(
    'SET_RECENT_ROOMS',
    Array.of(newRoom).concat(
      getters.GET_RECENT_ROOMS.filter(
        (room) => room.server !== newRoom.server || room.room !== newRoom.room,
      ),
    ),
  ),

  REMOVE_RECENT_ROOM: ({ commit, getters }, roomToRemove) => commit(
    'SET_RECENT_ROOMS',
    getters.GET_RECENT_ROOMS.filter(
      (room) => room.server !== roomToRemove.server || room.room !== roomToRemove.room,
    ),
  ),
};
