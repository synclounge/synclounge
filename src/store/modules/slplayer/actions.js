import axios from 'axios';
import CAF from 'caf';

import guid from '@/utils/guid';
import cancelablePeriodicTask from '@/utils/cancelableperiodictask';
import {
  play, pause, getDurationMs, areControlsShown, getCurrentTimeMs, isTimeInBufferedRange,
  isMediaElementAttached, isPlaying, isPresentationPaused, isBuffering, getVolume, isPaused,
  waitForMediaElementEvent, destroy, cancelTrickPlay, load, setPlaybackRate, getPlaybackRate,
  setCurrentTimeMs, setVolume, addEventListener, removeEventListener,
  getSmallPlayButton, getBigPlayButton,
} from '@/player';

export default {
  MAKE_TIMELINE_PARAMS: async ({ getters, rootGetters, dispatch }) => ({
    ratingKey: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
    key: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].key,
    // playbackTime: 591
    playQueueItemID: rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].playQueueItemID,
    state: getters.GET_PLAYER_STATE,
    hasMDE: 1,
    time: Math.floor(await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK')),
    duration: Math.floor(getDurationMs()),
    'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
    ...getters.GET_PART_PARAMS,
  }),

  FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK: ({ getters }) => getCurrentTimeMs()
    || getters.GET_OFFSET_MS,

  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const { data } = await axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_DECISION_AND_START_PARAMS,
    });
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, bitrate) => {
    commit('settings/SET_SLPLAYERQUALITY', bitrate, { root: true });
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, dispatch }, audioStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        audioStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, dispatch }, subtitleStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        subtitleStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_MEDIA_INDEX: async ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ commit, dispatch }) => {
    // Set buffering on src change since player doesn't trigger it then
    await dispatch('CHANGE_PLAYER_STATE', 'buffering');
    commit('SET_OFFSET_MS', await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_PLAYER_SRC: async ({ commit, dispatch }) => {
    commit('SET_SESSION', guid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');

    await Promise.all([
      dispatch('CHANGE_PLAYER_STATE', 'buffering'),
      dispatch('LOAD_PLAYER_SRC'),
    ]);
  },

  SEND_PLEX_TIMELINE_UPDATE: async ({ getters, dispatch }) => {
    await axios.get(getters.GET_TIMELINE_URL, {
      params: await dispatch('MAKE_TIMELINE_PARAMS'),
      timeout: 10000,
    });
  },

  FETCH_TIMELINE_POLL_DATA: async ({ getters, dispatch }) => (isMediaElementAttached()
    ? {
      time: await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'),
      duration: getDurationMs(),
      playbackRate: getPlaybackRate(),
      state: getters.GET_PLAYER_STATE,
    }
    : {
      time: 0,
      duration: 0,
      playbackRate: 0,
      state: getters.GET_PLAYER_STATE,
    }),

  HANDLE_PLAYER_PLAYING: async ({ dispatch }) => {
    if (isPlaying()) {
      await dispatch('CHANGE_PLAYER_STATE', 'playing');
    }
  },

  HANDLE_PLAYER_PAUSE: async ({ dispatch }) => {
    // Filter out the pause event that shaka raises when seeking to unbuffered range
    if (isPresentationPaused() && !isBuffering()) {
      await dispatch('CHANGE_PLAYER_STATE', 'paused');
    }
  },

  HANDLE_PLAYER_BUFFERING: async ({ dispatch }, event) => {
    if (event.buffering) {
      await dispatch('CHANGE_PLAYER_STATE', 'buffering');
    } else {
      // Report back if player is playing
      await dispatch('CHANGE_PLAYER_STATE', isPaused() ? 'paused' : 'playing');
    }
  },

  HANDLE_PLAYER_VOLUME_CHANGE: ({ commit }) => {
    commit('settings/SET_SLPLAYERVOLUME', getVolume(), { root: true });
  },

  HANDLE_PLAYER_CLICK: async ({ dispatch }, e) => {
    if (!e.target.classList.contains('shaka-close-button')) {
      await dispatch('SEND_PARTY_PLAY_PAUSE');
    }
  },

  PRESS_PLAY: () => {
    play();
  },

  PRESS_PAUSE: () => {
    pause();
  },

  PRESS_STOP: async ({ dispatch }) => {
    await dispatch('CHANGE_PLAYER_STATE', 'stopped');
  },

  SOFT_SEEK: ({ getters, commit }, seekToMs) => {
    // TODO: prob fix
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);
  },

  SPEED_SEEK: async ({ dispatch, rootGetters }, { cancelSignal, seekToMs }) => {
    console.log('speed seek');
    const currentTimeMs = await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
    const difference = seekToMs - currentTimeMs;
    const rate = 1 + (Math.sign(difference) * rootGetters.GET_CONFIG.slplayer_speed_sync_rate);
    const timeUntilSynced = (seekToMs - currentTimeMs) / (rate - 1);
    console.log('ms until synced: ', timeUntilSynced);

    const main = CAF(function* main(signal) {
      setPlaybackRate(rate);
      try {
        // Nosync process
        dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', true, { root: true });
        yield CAF.delay(signal, timeUntilSynced);
      } finally {
        setPlaybackRate(1);
        // Nosync process
        dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', true, { root: true });
      }
    });

    return main(cancelSignal);
  },

  NORMAL_SEEK: async ({ commit }, { cancelSignal, seekToMs }) => {
    console.log('normal seek');
    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);

    // TODO: throw that vlaue in the config
    const timeoutToken = CAF.timeout(15000, 'Took too long!');

    const anySignal = CAF.signalRace([
      cancelSignal,
      timeoutToken.signal,
    ]);

    const main = CAF(function* main(signal) {
      yield waitForMediaElementEvent({ signal, type: 'seeked' });
    });

    try {
      await main(anySignal);
    } finally {
      timeoutToken.abort();
    }
  },

  SPEED_OR_NORMAL_SEEK: async ({ dispatch, getters, rootGetters }, { cancelSignal, seekToMs }) => {
    // TODO: maybe separate functino for skip ahead probably lol
    // TODO: rewrite this entirely.
    // TODO: check the logic here to make sense if the seek time is in the past ...

    // TODO: make sure this doesnt happen when buffering
    const currentTimeMs = await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
    const difference = seekToMs - currentTimeMs;
    if (Math.abs(difference) <= rootGetters.GET_CONFIG.slplayer_speed_sync_max_diff
        && getters.GET_PLAYER_STATE === 'playing') {
      // TODO: lol
      return dispatch('SPEED_SEEK', { cancelSignal, seekToMs });
    }

    // TODO: more lol
    return dispatch('NORMAL_SEEK', { cancelSignal, seekToMs });
  },

  START_PERIODIC_PLEX_TIMELINE_UPDATE: async ({ commit, dispatch, rootGetters }) => {
    commit('SET_PLEX_TIMELINE_UPDATER_CANCELER', cancelablePeriodicTask(
      () => dispatch('SEND_PLEX_TIMELINE_UPDATE').catch(console.log),
      () => rootGetters.GET_CONFIG.slplayer_plex_timeline_update_interval,
    ));
  },

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, rootGetters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(() => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', areControlsShown());
    }, rootGetters.GET_CONFIG.slplayer_controls_visible_checker_interval));
  },

  CHANGE_PLAYER_STATE: async ({ commit, dispatch }, state) => {
    commit('SET_PLAYER_STATE', state);
    const plexTimelineUpdatePromise = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    if (state !== 'stopped') {
      await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', null, { root: true });
    }

    await plexTimelineUpdatePromise;
  },

  LOAD_PLAYER_SRC: async ({ getters }) => {
    // TODO: potentailly unload if already loaded to avoid load interrupted errors
    // However, while its loading, potentially   reporting the old time...
    try {
      const result = await load(getters.GET_SRC_URL);

      if (getters.GET_OFFSET_MS > 0) {
        setCurrentTimeMs(getters.GET_OFFSET_MS);
      }

      return result;
    } catch (e) {
      // Ignore 7000 error (load interrupted)
      if (e.code !== 7000) {
        throw e;
      }
    }

    return false;
  },

  NAVIGATE_AND_INITIALIZE_PLAYER: ({ commit }) => {
    // I don't really like this. I'd rather have the player be part of the main app rather than a vue route
    // TODO: above
    commit('SET_PLAYER_STATE', 'buffering');
    // TODO: this is bad practice, so if you know a better way...
    let resolver = null;
    const initializePromise = new Promise((resolve) => {
      resolver = resolve;
    });

    commit('SET_PLAYER_INITIALIZED_PROMISE_RESOLVER', resolver);
    commit('SET_NAVIGATE_TO_PLAYER', true, { root: true });

    return initializePromise;
  },

  INIT_PLAYER_STATE: async ({
    getters, rootGetters, commit, dispatch,
  }) => {
    await dispatch('REGISTER_PLAYER_EVENTS');
    await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    setVolume(rootGetters['settings/GET_SLPLAYERVOLUME']);
    await dispatch('CHANGE_PLAYER_SRC');

    await dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');

    if (getters.GET_PLAYER_INITIALIZED_PROMISE_RESOLVER) {
      getters.GET_PLAYER_INITIALIZED_PROMISE_RESOLVER();
      commit('SET_PLAYER_INITIALIZED_PROMISE_RESOLVER', null);
    }
    commit('SET_IS_PLAYER_INITIALIZED', true);
  },

  DESTROY_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    await dispatch('UNREGISTER_PLAYER_EVENTS');

    getters.GET_PLEX_TIMELINE_UPDATER_CANCELER();
    commit('SET_PLEX_TIMELINE_UPDATER_CANCELER', null);

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    // Leaving play queue around for possible upnext
    commit('SET_IS_PLAYER_INITIALIZED', false);
    await destroy();
    commit('SET_OFFSET_MS', 0);

    // Send out stop media update
    await dispatch('synclounge/PROCESS_MEDIA_UPDATE', null, { root: true });
  },

  REGISTER_PLAYER_EVENTS: ({ commit, dispatch }) => {
    const bufferingListener = (e) => dispatch('HANDLE_PLAYER_BUFFERING', e);
    addEventListener('buffering', bufferingListener);
    commit('SET_BUFFERING_EVENT_LISTENER', bufferingListener);

    const clickListener = (e) => dispatch('HANDLE_PLAYER_CLICK', e);
    getSmallPlayButton().addEventListener('click', clickListener);
    getBigPlayButton().addEventListener('click', clickListener);
    commit('SET_CLICK_EVENT_LISTENER', clickListener);
  },

  UNREGISTER_PLAYER_EVENTS: ({ getters, commit }) => {
    removeEventListener('buffering', getters.GET_BUFFERING_EVENT_LISTENER);
    commit('SET_BUFFERING_EVENT_LISTENER', null);

    getSmallPlayButton().removeEventListener('click', getters.GET_CLICK_EVENT_LISTENER);
    getBigPlayButton().removeEventListener('click', getters.GET_CLICK_EVENT_LISTENER);
    commit('SET_CLICK_EVENT_LISTENER', null);
  },

  PLAY_PAUSE_VIDEO: async ({ dispatch }) => {
    // TODO: probably move into player file
    if (!getDurationMs()) {
      // Can't play yet.  Ignore.
      return;
    }

    cancelTrickPlay();

    if (isPresentationPaused()) {
      await dispatch('PRESS_PLAY');
    } else {
      await dispatch('PRESS_PAUSE');
    }
  },

  SEND_PARTY_PLAY_PAUSE: async ({ dispatch }) => {
    // If the player was actually paused (and not just paused for seeking)
    await dispatch('synclounge/sendPartyPause', isPresentationPaused(), { root: true });
  },

  PLAY_NEXT: async ({ dispatch, commit }) => {
    commit('plexclients/INCREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_PREVIOUS: async ({ dispatch, commit }) => {
    commit('plexclients/DECREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: async ({ dispatch, commit, rootGetters }) => {
    await dispatch('plexclients/UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM', null, { root: true });

    // Assume same server machineIdentifier, but this may not always be okay to do. (TODO: figure it out)

    // TODO: maybe plex indicates ongoing media index?
    commit('SET_MEDIA_INDEX', 0);
    commit('SET_OFFSET_MS', rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].viewOffset || 0);

    await dispatch('CHANGE_PLAYER_SRC');

    await dispatch('plexclients/UPDATE_ACTIVE_PLAY_QUEUE', null, { root: true });
  },
};
