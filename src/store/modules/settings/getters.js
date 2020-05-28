const { defaultSettings } = require('@/default-settings');
const { coalesce } = require('@/utils/helpers');

// Use stored value if not null, othewise fallback to config, then default values
export default {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) => coalesce(state.autoplay, rootGetters['config/GET_CONFIG'].autoplay, defaultSettings.autoplay),
  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) => coalesce(
    state.clientPollInterval,
    rootGetters['config/GET_CONFIG'].clientPollInterval,
    defaultSettings.clientPollInterval,
  ),
  GET_SYNCMODE: (state, getters, rootState, rootGetters) => coalesce(state.syncMode, rootGetters['config/GET_CONFIG'].syncMode, defaultSettings.syncMode),
  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) => coalesce(
    state.syncFlexibility,
    rootGetters['config/GET_CONFIG'].syncFlexibility,
    defaultSettings.syncFlexibility,
  ),
  GET_CUSTOMSERVER: (state, getters, rootState, rootGetters) => coalesce(state.customServer, rootGetters['config/GET_CONFIG'].customServer),
  GET_BLOCKEDSERVERS: (state) => state.blockedServers,
  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerQuality,
    rootGetters['config/GET_CONFIG'].slPlayerQuality,
    defaultSettings.slPlayerQuality,
  ),
  GET_SLPLAYERVOLUME: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerVolume,
    rootGetters['config/GET_CONFIG'].slPlayerVolume,
    defaultSettings.slPlayerVolume,
  ),
  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerForceTranscode,
    rootGetters['config/GET_CONFIG'].slPlayerForceTranscode,
    defaultSettings.slPlayerForceTranscode,
  ),
  GET_HIDEUSERNAME: (state) => state.hideUsername,
  GET_ALTUSERNAME: (state) => state.altUsername,
  GET_CLIENTIDENTIFIER: (state) => state.clientIdentifier,
  GET_LASTSERVER: (state) => state.lastServer,
  GET_CUSTOM_SERVER_USER_INPUTTED_URL: (state) => state.customServerUserInputtedUrl,
  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
  GET_RECENT_ROOMS: (state) => state.recentRooms,
};
