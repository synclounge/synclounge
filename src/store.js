import Vue from 'vue';
import Vuex from 'vuex';

import { get, set } from '@/utils/storage';
import { generateGuid } from '@/utils/helpers';
import { getAll } from '@/utils/settings';
import config from './store/modules/config/config.store';

const plex = require('./store/modules/plex/').default;
const syncLounge = require('./store/modules/synclounge.js').default;

Vue.use(Vuex);

function sendNotification(message) {
  return window.EventBus.$emit('notification', message);
}

console.log('Got settings', getAll());
// Set up out web app socket for fetching short urls

const state = {
  appTitle: 'SyncLounge',
  appVersion: '2.0.0',
  background: null,
  shownChat: false,
  chosenClient: null,
  chosenClientTimeSet: new Date().getTime(),
  plexuser: JSON.parse(window.localStorage.getItem('plexuser')),
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  autoJoinUsername: null,
  shortLink: null,
  extAvailable: false,
  lastRatingKey: null,
  manualSyncQueued: false,
  uuid: generateGuid(),
  upNextCache: {},

  // SETTINGS
  settings: getAll(),
  stats: {},
  me: {},
};

const mutations = {
  SET_CHOSENCLIENT(state, client) {
    // Set up our client poller
    let commandInProgress = false;
    function clientPoller(time) {
      if (!state.chosenClient) {
        return;
      }
      if (state.chosenClientTimeSet !== time) {
        // We have a new chosen client, we need to stop
        return;
      }
      if (state.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') {
        if (!commandInProgress) {
          state.chosenClient
            .getTimeline()
            .then(() => {
              commandInProgress = false;
            })
            .catch((e) => {
              commandInProgress = false;
            });
          commandInProgress = true;
        }
      } else {
        state.chosenClient.getTimeline();
      }
      let interval = state.settings.CLIENTPOLLINTERVAL;
      if (state.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
        interval = 500;
      }
      setTimeout(() => {
        clientPoller(time);
      }, interval);
    }

    // Check if we need to remove old handlers
    if (state.chosenClient) {
      state.chosenClient.events.removeAllListeners();
    }
    state.chosenClient = client;
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      state.chosenClient.lastTimelineObject.ratingKey = -1;
    }
    if (state.chosenClient == null) {
      return;
    }
    state.chosenClientTimeSet = new Date().getTime();
    clientPoller(state.chosenClientTimeSet);
    state.chosenClient.getTimeline((timeline) => { });
  },
  SET_PLEX(state, value) {
    state.plex = value;
  },
  SET_AUTOJOIN(state, value) {
    state.autoJoin = value;
  },
  SET_BACKGROUND(state, value) {
    state.background = value;
  },
  SET_AUTOJOINROOM(state, value) {
    state.autoJoinRoom = value;
  },
  SET_AUTOJOINPASSWORD(state, value) {
    state.autoJoinPassword = value;
  },
  SET_AUTOJOINURL(state, value) {
    state.autoJoinUrl = value;
  },
  SET_SHORTLINK(state, value) {
    state.shortLink = value;
  },
  setSetting(state, data) {
    Vue.set(state.settings, data[0], data[1]);
    set(data[0], data[1]);
  },
  setSettingPTPLAYERQUALITY(state, data) {
    window.localStorage.setItem('PTPLAYERQUALITY', JSON.stringify(data));
    state.PTPLAYERQUALITY = data;
  },
  setSettingPTPLAYERVOLUME(state, data) {
    window.localStorage.setItem('PTPLAYERVOLUME', JSON.stringify(data));
    state.PTPLAYERVOLUME = data;
  },
  setSettingHOMEINIT(state, data) {
    set('HOMEINIT', data);
    state.HOMEINIT = data;
  },
  REFRESH_PLEXDEVICES() {
    store.state.plex.getDevices(() => { });
  },
  SET_RANDOMBACKROUND(state) {
    state.plex.getRandomThumb((result) => {
      if (result) {
        state.background = result;
      }
    });
  },

  SET_VALUE(state, data) {
    const [key, value] = data;
    Vue.set(state, key, value);
  },
};
const getters = {
  getAppVersion: state => state.appVersion,
  getPlex: state => state.plex,
  getPlexUser: state => state.plexuser,
  getBackground: state => state.background,
  getChosenClient: state => state.chosenClient,
  getShownChat: state => state.shownChat,
  getStats: state => state.stats,
  getBlockAutoPlay: state => state.blockAutoPlay,
  getAutoJoin: state => state.autoJoin,
  getAutoJoinRoom: state => state.autoJoinRoom,
  getAutoJoinPassword: state => state.autoJoinPassword,
  getAutoJoinUrl: state => state.autoJoinUrl,
  getShortLink: state => state.shortLink,

  // SETTINGS
  getSettings: state => state.settings,
  getSettingHOMEINIT: state => state.HOMEINIT,
  getSettingPTPLAYERQUALITY: state => state.PTPLAYERQUALITY,
  getSettingPTPLAYERVOLUME: state => state.PTPLAYERVOLUME,
  getExtAvailable: state => state.extAvailable,
  getLogos: () => ({
    light: {
      long: 'logo-long-light.png',
      small: 'logo-small-light.png',
    },
    dark: {
      long: 'logo-long-dark.png',
    },
    plex: {
      standard: 'plexlogo.png',
    },
  }),
};
const actions = {
  async PLAYBACK_CHANGE({ commit, state, dispatch }, data) {
    const [client, ratingKey, mediaContainer] = data;
    if (ratingKey) {
      // Playing something different!
      const server = state.plex.servers[mediaContainer.machineIdentifier];
      commit('setSetting', ['LASTSERVER', mediaContainer.machineIdentifier]);
      // state.settings.LASTSERVER = mediaContainer.machineIdentifier;
      // window.localStorage.setItem('LASTSERVER', mediaContainer.machineIdentifier);
      if (!server) {
        return;
      }
      // Fetch our metadata from this server
      // console.log('Loading content metadata from store ' + ratingKey)
      server.getMediaByRatingKey(ratingKey.replace('/library/metadata/', '')).then((data) => {
        const metadata = data.MediaContainer.Metadata[0];
        if (!metadata) {
          return;
        }
        if (metadata.type === 'movie') {
          sendNotification(`Now Playing: ${metadata.title} from ${
            state.plex.servers[metadata.machineIdentifier].name
          }`);
        }
        if (metadata.type === 'episode') {
          sendNotification(`Now Playing: ${metadata.grandparentTitle} S${metadata.parentIndex}E${
            metadata.index
          } from ${state.plex.servers[metadata.machineIdentifier].name}`);
        }
        state.chosenClient.clientPlayingMetadata = metadata;
        const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        const h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        state.background = state.plex.servers[metadata.machineIdentifier].getUrlForLibraryLoc(
          metadata.thumb,
          w / 4,
          h / 4,
          4,
        );
      });
    } else {
      state.chosenClient.clientPlayingMetadata = null;
      const thumb = await state.plex.getRandomThumb(state.plex);
      if (thumb) {
        state.background = thumb;
      }
    }
  },
  NEW_TIMELINE({ commit, state, dispatch }, data) {
    // return true
    const timeline = data;
    const client = state.chosenClient;
    const metadata = state.chosenClient.clientPlayingMetadata || {};
    // console.log(state)
    if (!state.chosenClient || client.clientIdentifier !== state.chosenClient.clientIdentifier) {
      console.log('Invalid client');
      return false;
    }
    if (state.lastRatingKey !== timeline.ratingKey) {
      commit('SET_VALUE', ['lastRatingKey', timeline.ratingKey]);
      dispatch('PLAYBACK_CHANGE', [client, timeline.ratingKey, timeline]);
    }

    // Check if we need to activate the upnext feature
    if (state.me && state.me.role === 'host') {
      if (
        timeline.duration &&
        timeline.time &&
        Math.abs(timeline.duration - timeline.time) < 10000 &&
        metadata.type === 'episode'
      ) {
        console.log('Checking upnext');
        if (!state.upNextCache[timeline.machineIdentifier]) {
          state.upNextCache[timeline.machineIdentifier] = {};
        }
        if (!state.upNextCache[timeline.machineIdentifier][timeline.key]) {
          state.upNextCache[timeline.machineIdentifier][timeline.key] = {
            loading: true,
          };
          state.plex.servers[timeline.machineIdentifier].getPostplay(timeline.key).then((data) => {
            data.machineIdentifier = state.chosenClient.lastTimelineObject.machineIdentifier;
            state.upNextCache[timeline.machineIdentifier][timeline.key] = data;
            // Only proc upnext if the item upnext is from the same show
            if (
              data.MediaContainer.Hub[0].Metadata[0].grandparentTitle === metadata.grandparentTitle
            ) {
              window.EventBus.$emit('upnext', data);
            }
          });
        } else {
          console.log('Already procced an upnext for this item', timeline);
        }
      }
    }

    // state.ourClientResponseTime = timeline.lastResponseTime
    let title = null;
    let rawTitle = null;
    let type = null;
    let showName = null;
    if (state.chosenClient.clientPlayingMetadata) {
      rawTitle = metadata.title;
      if (metadata.type === 'episode') {
        title =
          `${metadata.grandparentTitle} - ${metadata.title} S${metadata.parentIndex}-` +
          `E${metadata.index}`;
        showName = metadata.grandparentTitle;
      } else {
        title = metadata.title;
      }
      type = metadata.type;
    }
    let status = 'good';
    if (!state.synclounge.lastHostTimeline || isNaN(state.synclounge.lastHostTimeline.time)) {
      status = 'error';
    } else {
      const hostAge = Math.abs(new Date().getTime() - state.synclounge.lastHostTimeline.recievedAt);
      let hostTime = 0 + state.synclounge.lastHostTimeline.time;
      if (state.synclounge.lastHostTimeline.playerState === 'playing') {
        hostTime = parseInt(hostTime) + parseInt(hostAge);
      }
      const difference = Math.abs(data.time - hostTime);
      if (difference > state.settings.SYNCFLEXABILITY) {
        status = 'notok';
      }
    }

    const endObj = {
      time: parseInt(timeline.time),
      maxTime: parseInt(timeline.duration),
      title,
      rawTitle,
      playerState: timeline.state,
      clientResponseTime: state.chosenClient.lastResponseTime,
      playerProduct: state.chosenClient.product,
      status,
      type,
      showName,
      uuid: state.uuid,
    };
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      endObj.machineIdentifier = state.chosenClient.lastTimelineObject.machineIdentifier;
      endObj.key = state.chosenClient.lastTimelineObject.key;
    }
    if (state.synclounge._socket) {
      const commandId = Object.keys(state.synclounge.commands).length + 1;
      state.synclounge.commands[commandId] = {
        start: new Date().getTime(),
      };
      endObj.commandId = commandId;
      if (Object.keys(state.synclounge.commands).length > 1) {
        const latency =
          state.synclounge.commands[Object.keys(state.synclounge.commands).length - 1].difference;
        endObj.latency = latency;
      }
      state.synclounge._socket.emit('poll', endObj);
    }
  },
};

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    synclounge: syncLounge,
    plex,
    config,
  },
});

export default store;
