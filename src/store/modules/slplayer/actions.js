import CAF from 'caf';

import guid from '@/utils/guid';
import { fetchJson, queryFetch, makeUrl } from '@/utils/fetchutils';
import {
  play, pause, getDurationMs, getCurrentTimeMs, isTimeInBufferedRange,
  isMediaElementAttached, isPlaying, isPresentationPaused, isBuffering, getVolume, isPaused,
  waitForMediaElementEvent, destroy, cancelTrickPlay, load, setPlaybackRate, getPlaybackRate,
  setCurrentTimeMs, setVolume, addEventListener, removeEventListener,
  getSmallPlayButton, getBigPlayButton, unload,
} from '@/player';
import {
  destroySubtitles, setSubtitleUrl, destroyAss, areControlsShown,
} from '@/player/state';
import Deferred from '@/utils/deferredpromise';

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

  FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK: ({ getters }) => (getters.GET_MASK_PLAYER_STATE
    ? getters.GET_OFFSET_MS
    : getCurrentTimeMs() || getters.GET_OFFSET_MS),

  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const data = await fetchJson(getters.GET_DECISION_URL, getters.GET_DECISION_AND_START_PARAMS);
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, bitrate) => {
    commit('settings/SET_SLPLAYERQUALITY', bitrate, { root: true });
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, dispatch }, audioStreamID) => {
    await queryFetch(getters.GET_PART_URL, {
      audioStreamID,
      ...getters.GET_PART_PARAMS,
    }, { method: 'PUT' });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, dispatch }, subtitleStreamID) => {
    await queryFetch(getters.GET_PART_URL, {
      subtitleStreamID,
      ...getters.GET_PART_PARAMS,
    }, { method: 'PUT' });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_MEDIA_INDEX: async ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ commit, dispatch }) => {
    commit('SET_OFFSET_MS', await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_SUBTITLES: async ({ getters }) => {
    if (getters.GET_SUBTITLE_STREAM_ID && !getters.GET_SUBTITLE_STREAM.burn) {
      await setSubtitleUrl(makeUrl(getters.GET_SUBTITLE_BASE_URL,
        getters.GET_DECISION_AND_START_PARAMS));
    } else {
      destroyAss();
    }
  },

  CHANGE_PLAYER_SRC: async ({ getters, commit, dispatch }) => {
    console.debug('CHANGE_PLAYER_SRC');
    commit('SET_SESSION', guid());

    // Abort subtitle requests now or else we get ugly errors from the server closing it.
    destroyAss();
    await dispatch('SEND_PLEX_DECISION_REQUEST');
    await dispatch('LOAD_PLAYER_SRC');
    await dispatch('CHANGE_SUBTITLES');

    // TODO: potentially avoid sending updates on media change since we already do that
    if (getters.GET_MASK_PLAYER_STATE) {
      commit('SET_MASK_PLAYER_STATE', false);
    }
  },

  SEND_PLEX_TIMELINE_UPDATE: async ({ getters, dispatch },
    { signal, ...extraParams } = {},
  ) => queryFetch(
    getters.GET_TIMELINE_URL,
    {
      ...await dispatch('MAKE_TIMELINE_PARAMS'),
      ...extraParams,
    },
    { signal },
  ),

  FETCH_TIMELINE_POLL_DATA: async ({ getters, dispatch }) => (isMediaElementAttached()
    ? {
      time: await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'),
      duration: getDurationMs(),
      playbackRate: getPlaybackRate(),
      state: getters.GET_PLAYER_STATE,
    }
    : {
      time: getters.GET_OFFSET_MS,
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
    if (isBuffering()) {
      // If we are buffering, then we don't need to actually change the state, but we should send out
      // a new state update to synclounge since we have seeked
      await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', null, { root: true });
    } else if (isPresentationPaused()) {
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

  HANDLE_SEEKING: async () => {
    console.debug('HANDLE_SEEKING');
    destroyAss();
  },

  HANDLE_SEEKED: async ({ dispatch }) => {
    console.debug('HANDLE_SEEKED');
    await dispatch('CHANGE_SUBTITLES');
  },

  HANDLE_PICTURE_IN_PICTURE_CHANGE: async ({ getters, commit, dispatch }) => {
    commit('SET_IS_IN_PICTURE_IN_PICTURE', document.pictureInPictureElement != null);
    if (getters.IS_IN_PICTURE_IN_PICTURE && getters.GET_SUBTITLE_STREAM_ID
      && !getters.GET_SUBTITLE_STREAM?.burn) {
      // If we are in picture and picture, we must burn subtitles
      // Redo src
      await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
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
    console.debug('SOFT_SEEK', seekToMs);
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);
  },

  PROCESS_STATE_UPDATE_ON_PLAYBACK_RATE_CHANGE: async ({ dispatch }, signal) => {
    await waitForMediaElementEvent({ signal, type: 'ratechange' });
    await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', true, { root: true });
  },

  SPEED_SEEK: async ({ dispatch, rootGetters }, { cancelSignal, seekToMs }) => {
    console.debug('SPEED_SEEK', seekToMs);
    const currentTimeMs = await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
    const difference = seekToMs - currentTimeMs;
    const rate = 1 + (Math.sign(difference) * rootGetters.GET_CONFIG.slplayer_speed_sync_rate);
    const timeUntilSynced = (seekToMs - currentTimeMs) / (rate - 1);
    console.log('ms until synced: ', timeUntilSynced);

    const main = CAF(function* main(signal) {
      setPlaybackRate(rate);

      try {
        // Nosync process. Purposefully not awaited
        dispatch('PROCESS_STATE_UPDATE_ON_PLAYBACK_RATE_CHANGE', signal);
        yield CAF.delay(signal, timeUntilSynced);
      } finally {
        setPlaybackRate(1);
        // Nosync process. Purposefully not awaited
        dispatch('PROCESS_STATE_UPDATE_ON_PLAYBACK_RATE_CHANGE', signal);
      }
    });

    return main(cancelSignal);
  },

  NORMAL_SEEK: async ({ rootGetters, commit }, { cancelSignal, seekToMs }) => {
    console.debug('NORMAL_SEEK', seekToMs);
    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);

    const timeoutToken = CAF.timeout(rootGetters.GET_CONFIG.slplayer_seek_timeout,
      'Normal seek took too long');

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
      return dispatch('SPEED_SEEK', { cancelSignal, seekToMs });
    }

    return dispatch('NORMAL_SEEK', { cancelSignal, seekToMs });
  },

  START_PERIODIC_PLEX_TIMELINE_UPDATE: async ({ commit, dispatch, rootGetters }) => {
    // eslint-disable-next-line new-cap
    const cancelToken = new CAF.cancelToken();

    commit('SET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN', cancelToken);

    const main = CAF(function* plexTimelineUpdater(signal) {
      while (true) {
        yield CAF.delay(signal, rootGetters.GET_CONFIG.slplayer_plex_timeline_update_interval);

        try {
          yield dispatch('SEND_PLEX_TIMELINE_UPDATE', signal);
        } catch (e) {
          console.error(e);
        }
      }
    });

    try {
      await main(cancelToken.signal);
    } catch (e) {
      console.debug('PLEX_TIMELINE_UPDATER canceled');
    }
  },

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, rootGetters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(() => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', areControlsShown());
    }, rootGetters.GET_CONFIG.slplayer_controls_visible_checker_interval));
  },

  CHANGE_PLAYER_STATE: async ({ commit, dispatch }, state) => {
    console.debug('CHANGE_PLAYER_STATE', state);
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
    await unload();
    await load(getters.GET_SRC_URL);

    if (getters.GET_OFFSET_MS > 0) {
      setCurrentTimeMs(getters.GET_OFFSET_MS);
    }
  },

  NAVIGATE_AND_INITIALIZE_PLAYER: ({ commit }) => {
    console.debug('NAVIGATE_AND_INITIALIZE_PLAYER');
    // I don't really like this. I'd rather have the player be part of the main app rather than a vue route
    // TODO: above

    // TODO: this is bad practice, so if you know a better way...
    const deferred = Deferred();

    commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', deferred);
    commit('SET_NAVIGATE_TO_PLAYER', true, { root: true });

    return deferred.promise;
  },

  INIT_PLAYER_STATE: async ({
    getters, rootGetters, commit, dispatch,
  }) => {
    console.debug('INIT_PLAYER_STATE');

    try {
      await dispatch('REGISTER_PLAYER_EVENTS');
      await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
      setVolume(rootGetters['settings/GET_SLPLAYERVOLUME']);
      await dispatch('CHANGE_PLAYER_SRC');

      // Purposefully not awaited
      dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    } catch (e) {
      if (getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE) {
        // TODO: potentially close player
        getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE.reject(e);
        commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', null);
      }
    }

    if (getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE) {
      getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE.resolve();
      commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', null);
    }

    commit('SET_IS_PLAYER_INITIALIZED', true);
  },

  CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE: ({ getters, commit }) => {
    if (getters.GET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN) {
      getters.GET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN.abort();
      commit('SET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN', null);
    }
  },

  DESTROY_PLAYER_STATE: async ({ commit, dispatch }) => {
    console.debug('DESTROY_PLAYER_STATE');
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    commit('UPDATE_PLAYER_CONTROLS_SHOWN', false);
    await dispatch('UNREGISTER_PLAYER_EVENTS');
    await dispatch('CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE');

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    // Leaving play queue around for possible upnext
    commit('SET_IS_PLAYER_INITIALIZED', false);
    commit('SET_IS_IN_PICTURE_IN_PICTURE', false);
    destroySubtitles();
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
    console.debug('slplayer/PLAY_NEXT');
    commit('plexclients/INCREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_PREVIOUS: async ({ dispatch, commit }) => {
    commit('plexclients/DECREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: async ({ dispatch, commit, rootGetters }) => {
    await dispatch('CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE');
    await dispatch('SEND_PLEX_TIMELINE_UPDATE', {
      state: 'stopped',
      continuing: 1,
    });

    await dispatch('plexclients/UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM', null, { root: true });
    // TODO: maybe plex indicates ongoing media index?
    commit('SET_MEDIA_INDEX', 0);
    commit('SET_OFFSET_MS', rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].viewOffset || 0);
    commit('SET_MASK_PLAYER_STATE', true);
    await dispatch('synclounge/PROCESS_MEDIA_UPDATE', null, { root: true });

    await dispatch('CHANGE_PLAYER_SRC');

    // Purposefully not awaited
    dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');

    await dispatch('plexclients/UPDATE_ACTIVE_PLAY_QUEUE', null, { root: true });
  },

  SKIP_INTRO: ({ commit, rootGetters }) => {
    console.debug('SKIP_INTRO');
    const introEnd = rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER'].endTimeOffset;

    commit('SET_OFFSET_MS', introEnd);
    setCurrentTimeMs(introEnd);
  },
};
