const linkWithRoom = (getters, { params, ...rest }) => ({
  ...rest,
  params: {
    ...params,
    room: getters['synclounge/GET_ROOM'],
    ...(getters['synclounge/GET_SERVER'] && {
      server: getters['synclounge/GET_SERVER'],
    }),
  },
});

export default linkWithRoom;
