import { coalesce, generateGuid } from '@/utils/helpers';

const mutations = {
  initClientIdentifier(state, payload) {
    state.count += payload.amount
  }
};

// Use stored value if not null, othewise fallback to config, then default values
// TODO: generate uuid if not exists
const getters = {
  GET_AUTOPLAY: ({ state, rootGetters }) => { coalesce(state.AUTOPLAY, rootGetters['config/configuration'].AUTOPLAY, defaultSettings.AUTOPLAY) },
  GET_CLIENTPOLLINTERVAL: ({ state, rootGetters }) => { coalesce(state.CLIENTPOLLINTERVAL, rootGetters['config/configuration'].CLIENTPOLLINTERVAL, defaultSettings.CLIENTPOLLINTERVAL) },
  GET_SYNCMODE: ({ state, rootGetters }) => { coalesce(state.SYNCMODE, rootGetters['config/configuration'].SYNCMODE, defaultSettings.SYNCMODE) },
  GET_SYNCFLEXABILITY: ({ state, rootGetters }) => { coalesce(state.SYNCFLEXABILITY, rootGetters['config/configuration'].SYNCFLEXABILITY, defaultSettings.SYNCFLEXABILITY) },
  GET_CUSTOMSERVER: ({ state, rootGetters }) => { coalesce(state.CUSTOMSERVER, rootGetters['config/configuration'].CUSTOMSERVER, defaultSettings.CUSTOMSERVER) },
  GET_BLOCKEDSERVERS: state => state.BLOCKEDSERVERS,
  GET_HOMEINIT: state => state.HOMEINIT,
  GET_PTPLAYERQUALITY: ({ state, rootGetters }) => { coalesce(state.PTPLAYERQUALITY, rootGetters['config/configuration'].PTPLAYERQUALITY, defaultSettings.PTPLAYERQUALITY) },
  GET_PTPLAYERVOLUME: ({ state, rootGetters }) => { coalesce(state.PTPLAYERVOLUME, rootGetters['config/configuration'].PTPLAYERVOLUME, defaultSettings.PTPLAYERVOLUME) },
  GET_SLPLAYERFORCETRANSCODE: ({ state, rootGetters }) => { coalesce(state.SLPLAYERFORCETRANSCODE, rootGetters['config/configuration'].SLPLAYERFORCETRANSCODE, defaultSettings.SLPLAYERFORCETRANSCODE) },
  GET_HIDEUSERNAME: ({ state, rootGetters }) => { coalesce(state.HIDEUSERNAME, rootGetters['config/configuration'].HIDEUSERNAME, defaultSettings.HIDEUSERNAME) },
  GET_ALTUSERNAME: ({ state, rootGetters }) => { coalesce(state.ALTUSERNAME, rootGetters['config/configuration'].ALTUSERNAME, defaultSettings.ALTUSERNAME) },
  GET_CLIENTIDENTIFIER: state => state.CLIENTIDENTIFIER,
  GET_LASTSERVER: state => state.LASTSERVER
};

// The state must return a function
// to make the module reusable.
// See: https://vuex.vuejs.org/en/modules.html#module-reuse
const state = () => ({
  'AUTOPLAY': null,
  'CLIENTPOLLINTERVAL': null,
  'SYNCMODE': null,
  'SYNCFLEXABILITY': null,
  'CUSTOMSERVER': null,
  'BLOCKEDSERVERS': [],
  'HOMEINIT': false,
  'PTPLAYERQUALITY': null,
  'PTPLAYERVOLUME': null,
  'SLPLAYERFORCETRANSCODE': null,
  'HIDEUSERNAME': null,
  'ALTUSERNAME': null,
  'CLIENTIDENTIFIER': `${generateGuid()}-${generateGuid()}`,
  'LASTSERVER': null
});

export default {
  namespaced: true,
  mutations,
  getters,
  state
};