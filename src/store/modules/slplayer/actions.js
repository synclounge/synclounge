import axios from 'axios';

import guid from '@/utils/guid';
import timeoutPromise from '@/utils/timeoutpromise';
import delay from '@/utils/delay';
import cancelablePeriodicTask from '@/utils/cancelableperiodictask';
import {
  play, pause, getDurationMs, areControlsShown, getCurrentTimeMs, isTimeInBufferedRange,
  isMediaElementAttached, isPlaying, isPresentationPaused, isBuffering, getVolume, isPaused,
  waitForMediaElementEvent, destroy, cancelTrickPlay, load, getPlaybackRate, setPlaybackRate,
  setCurrentTimeMs, setVolume, addEventListener, removeEventListener, initialize,
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
      state: getters.GET_PLAYER_STATE,
    }
    : {
      time: 0,
      duration: 0,
      state: getters.GET_PLAYER_STATE,
    }),

  HANDLE_PLAYER_PLAYING: async ({ dispatch }) => {
    if (isPlaying()) {
      await dispatch('CHANGE_PLAYER_STATE', 'playing');
    }
  },

  HANDLE_PLAYER_PAUSE: async ({ dispatch }) => {
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
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);
  },

  NORMAL_SEEK: async ({ dispatch, getters, commit }, seekToMs) => {
    // TODO: rewrite this entirely.
    // TODO: check the logic here to make sense if the seek time is in the past ...
    if (Math.abs(seekToMs - await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK')) < 3000
    && getters.GET_PLAYER_STATE === 'playing') {
      let cancelled = false;

      window.EventBus.$once('host-playerstate-change', () => {
        cancelled = true;
      });

      let iterations = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-underscore-dangle
        if (cancelled || getters.GET_PLAYER_STATE !== 'playing') {
          setPlaybackRate(1);
          throw new Error('Slow seek was stop due to buffering or pausing');
        }

        const delayPromise = delay(25);

        // 25 here because interval is 25ms
        const expectedHostTimeMs = seekToMs + (25 * iterations);

        // eslint-disable-next-line no-await-in-loop
        const difference = expectedHostTimeMs - await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
        const absDifference = Math.abs(difference);

        if (absDifference < 30) {
          setPlaybackRate(1);
          return true;
        }

        if (absDifference > 5000) {
          setPlaybackRate(1);
          throw new Error('Slow seek was stopped as we are beyond 5000ms');
        }

        if (difference > 0) {
          if (getPlaybackRate() < 1.02) {
            // Speed up
            setPlaybackRate(getPlaybackRate() + 0.0001);
          }
        } else if (getPlaybackRate() > 0.98) {
          // Slow down
          setPlaybackRate(getPlaybackRate() - 0.0001);
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;

        iterations += 1;
      }
    } else {
      commit('SET_OFFSET_MS', seekToMs);
      setCurrentTimeMs(seekToMs);

      return timeoutPromise(waitForMediaElementEvent('seeked'), 15000);
    }
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
    console.log('change palyer state', state);
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

  INIT_PLAYER_STATE: async ({ rootGetters, dispatch }, data) => {
    await initialize(data);
    await dispatch('REGISTER_PLAYER_EVENTS');
    await dispatch('CHANGE_PLAYER_SRC');

    setVolume(rootGetters['settings/GET_SLPLAYERVOLUME']);

    await dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
  },

  DESTROY_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    await dispatch('UNREGISTER_PLAYER_EVENTS');

    getters.GET_PLEX_TIMELINE_UPDATER_CANCELER();
    commit('SET_PLEX_TIMELINE_UPDATER_CANCELER', null);

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    // Leaving play queue around for possible upnext
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
