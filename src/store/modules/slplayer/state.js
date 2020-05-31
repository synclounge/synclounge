const state = () => ({
  session: null,
  // TODO: find out why we need 2 session ids
  xplexsessionId: null,

  key: null,
  metadata: null,
  plexServerId: null,

  mediaIndex: 0,
  subtitleStreamID: -1,
  audioStreamID: null,
  maxVideoBitrate: null,

  offset: 0,
});


export default state;
