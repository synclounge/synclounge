import Vue from 'vue';
import { slPlayerClientId } from '@/player/constants';
import stateFactory from './state';

export default {
  RESET: (state) => {
    Object.assign(state, stateFactory());
  },

  ADD_PLEX_CLIENT: (state, client) => {
    Vue.set(state.clients, client.clientIdentifier, client);
  },

  DELETE_PLEX_CLIENT: (state, clientId) => {
    Vue.delete(state.clients, clientId);
  },

  SET_CHOSEN_CLIENT_ID: (state, id) => {
    state.chosenClientId = id;
  },

  SET_PLEX_CLIENT_TIMELINE: (state, timeline) => {
    state.plexClientTimeline = timeline;
  },

  SET_ACTIVE_MEDIA_METADATA: (state, metadata) => {
    state.activeMediaMetadata = metadata;
  },

  SET_ACTIVE_SERVER_ID: (state, id) => {
    state.activeServerId = id;
  },

  SET_COMMAND_ID: (state, id) => {
    state.commandId = id;
  },

  INCREMENT_COMMAND_ID: (state) => {
    state.commandId += 1;
  },

  SET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID: (state, commandId) => {
    state.previousSyncTimelineCommandId = commandId;
  },

  SET_CLIENT_CHOSEN_CONNECTION: (state, { clientIdentifier, chosenConnection }) => {
    Vue.set(state.clients[clientIdentifier], 'chosenConnection', chosenConnection);
  },

  SET_PLEX_CLIENT_TIMELINE_COMMAND_ID: (state, id) => {
    state.plexClientTimelineCommmandId = id;
  },

  SET_ACTIVE_PLAY_QUEUE: (state, queue) => {
    state.activePlayQueue = queue;
  },

  SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER: (state, id) => {
    state.activePlayQueueMachineIdentifier = id;
  },

  INCREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET: (state) => {
    state.activePlayQueue.playQueueSelectedItemOffset += 1;
  },

  DECREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET: (state) => {
    state.activePlayQueue.playQueueSelectedItemOffset -= 1;
  },

  SET_CLIENT_POLLER_CANCEL_TOKEN: (state, token) => {
    state.clientPollerCancelToken = token;
  },

  SET_LAST_PLAY_MEDIA_COMMAND_ID: (state, id) => {
    state.lastPlayMediaCommandId = id;
  },

  SET_LATENCY: (state, latency) => {
    state.latency = latency;
  },

  UPDATE_SLPLAYER_LAST_SEEN_TO_NOW: (state) => {
    state.clients[slPlayerClientId].lastSeenAt = new Date().toISOString();
  },
};
