import { makeUrl } from '@/utils/fetchutils';
import {
  getControlsOffsetWithVisibility, isPaused, getPlaybackRate, getCurrentTimeMs, getDimensions,
  insertElementBeforeVideo, getMediaElement, getCurrentTime,
} from '@/player';
import resiliantStreamFactory from '@/utils/streams';
import { hexToLibjassColor, subtitleSettings, getBestOutlineColor } from '@/utils/subtitleutils';
import VideoClock from '@/utils/videoclock';

let videoClock = null;
let subtitleRenderer = null;
let assAbortController = null;

const handleStreamError = async (assPromise) => {
  try {
    await assPromise;
  } catch (e) {
    if (assAbortController) {
      // If there is no abort controller, we have just aborted
      // If there is one, then something went wrong
      throw e;
    }
  }
};

export default {
  CACHE_ORIGINAL_SUBTITLE_RESOLUTION: ({ getters, commit }) => {
    if (!getters.GET_ORIGINAL_SUBTITLE_RESOLUTION_X_CACHE
      || !getters.GET_ORIGINAL_SUBTITLE_RESOLUTION_Y_CACHE) {
      commit(
        'SET_ORIGINAL_SUBTITLE_RESOLUTION_X_CACHE',
        subtitleRenderer.ass.properties.resolutionX,
      );

      commit(
        'SET_ORIGINAL_SUBTITLE_RESOLUTION_Y_CACHE',
        subtitleRenderer.ass.properties.resolutionY,
      );
    }
  },

  SYNCHRONIZE_SUBTITLE_CLOCK: () => {
    if (isPaused() && !videoClock.paused) {
    // eslint-disable-next-line no-underscore-dangle
      videoClock._autoClock.pause();
    } else if (!isPaused() && videoClock.paused) {
    // eslint-disable-next-line no-underscore-dangle
      videoClock._autoClock.play();
    }

    if (getPlaybackRate() && !videoClock.rate) {
    // eslint-disable-next-line no-underscore-dangle
      videoClock._autoClock.setRate(getPlaybackRate());
    }

    if (getCurrentTimeMs() && !videoClock.currentTime) {
    // eslint-disable-next-line no-underscore-dangle
      videoClock._autoClock.seeking();
    }
  },

  GET_OR_MAKE_VIDEO_CLOCK: async ({ getters, dispatch }) => {
    const libjass = await import('synclounge-libjass');

    if (!videoClock) {
      videoClock = new VideoClock(
        getMediaElement(),
        new libjass.renderers.AutoClock(() => Math.max(getCurrentTime()
          + (getters.GET_SUBTITLE_OFFSET / 1000), 0), 100),

      );
    }

    await dispatch('SYNCHRONIZE_SUBTITLE_CLOCK');

    return videoClock;
  },

  PUBLISH_SUBTITLE_POSITION: ({ getters }) => {
    console.debug('PUBLISH_SUBTITLE_POSITION');
    // eslint-disable-next-line no-underscore-dangle
    subtitleRenderer.ass.styles.get('Default')._alignment = getters.GET_SUBTITLE_POSITION;
  },

  PUBLISH_SUBTITLE_COLOR: async ({ getters }) => {
    console.debug('PUBLISH_SUBTITLE_COLOR');

    const defaultStyle = subtitleRenderer.ass.styles.get('Default');
    // eslint-disable-next-line no-underscore-dangle
    defaultStyle._primaryColor = await hexToLibjassColor(getters.GET_SUBTITLE_COLOR);

    // eslint-disable-next-line no-underscore-dangle
    defaultStyle._outlineColor = await hexToLibjassColor(
      // eslint-disable-next-line no-underscore-dangle
      getBestOutlineColor(defaultStyle._primaryColor),
    );
  },

  PUBLISH_SUBTITLE_SIZE: async ({ getters, dispatch }) => {
    console.debug('PUBLISH_SUBTITLE_SIZE');

    await dispatch('CACHE_ORIGINAL_SUBTITLE_RESOLUTION');

    const assProperties = subtitleRenderer.ass.properties;

    assProperties.resolutionX = getters.GET_ORIGINAL_SUBTITLE_RESOLUTION_X_CACHE
      / getters.GET_SUBTITLE_SIZE;

    assProperties.resolutionY = getters.GET_ORIGINAL_SUBTITLE_RESOLUTION_Y_CACHE
      / getters.GET_SUBTITLE_SIZE;
  },

  RERENDER_SUBTITLE_CONTAINER: async ({ dispatch }) => {
    // Handle letterboxing around the video. If the width or height are greater than the video can
    // be, then consider that dead space.
    if (!subtitleRenderer) {
      return;
    }

    const bottomOffset = getControlsOffsetWithVisibility();
    console.debug('RERENDER_SUBTITLE_CONTAINER', bottomOffset);

    const {
      videoWidth, videoHeight, offsetWidth, offsetHeight,
    } = getDimensions();

    const ratio = Math.min(offsetWidth / videoWidth, (offsetHeight - bottomOffset) / videoHeight);
    const subsWrapperWidth = videoWidth * ratio;
    const subsWrapperHeight = videoHeight * ratio;
    const subsWrapperLeft = (offsetWidth - subsWrapperWidth) / 2;
    const subsWrapperTop = ((offsetHeight - bottomOffset) - subsWrapperHeight) / 2;

    await dispatch('PUBLISH_SUBTITLE_COLOR');
    await dispatch('PUBLISH_SUBTITLE_POSITION');
    subtitleRenderer.resize(subsWrapperWidth, subsWrapperHeight, subsWrapperLeft, subsWrapperTop);
  },

  DESTROY_ASS: async ({ dispatch, commit }) => {
    if (assAbortController) {
      console.debug('DESTROY_ASS');
      assAbortController.abort();
      assAbortController = null;

      if (subtitleRenderer) {
        // It's possible we haven't finished making the renderer
      // eslint-disable-next-line no-underscore-dangle
        subtitleRenderer._ass._dialogues = [];
        // eslint-disable-next-line no-underscore-dangle
        subtitleRenderer._ass._attachments = [];

        commit('SET_ORIGINAL_SUBTITLE_RESOLUTION_X_CACHE', null);
        commit('SET_ORIGINAL_SUBTITLE_RESOLUTION_Y_CACHE', null);

        // Resizing clears out rendered subtitles
        await dispatch('RERENDER_SUBTITLE_CONTAINER');
      }
    }
  },

  MAKE_ASS: async ({ getters }) => {
    console.debug('MAKE_ASS');
    const libjass = await import('synclounge-libjass');
    assAbortController = new AbortController();

    const stream = resiliantStreamFactory(
      makeUrl(
        getters.GET_SUBTITLE_BASE_URL,
        getters.GET_DECISION_AND_START_PARAMS,
      ),
      assAbortController.signal,
    );

    const useSrtParser = getters.CAN_DIRECT_PLAY_SUBTITLES
      && (getters.GET_SUBTITLE_STREAM.codec === 'srt'
        || getters.GET_SELECTED_SUBTITLE_STREAM.codec === 'srt');

    const parser = useSrtParser
      ? new libjass.parser.SrtStreamParser(stream)
      : new libjass.parser.StreamParser(stream);

    if (!useSrtParser) {
      // Purposefully not awaited because we never get the full file at once
      // We still need to catch abort errors to clean up console
      handleStreamError(parser.ass);
    }

    return useSrtParser
      ? parser.ass
      : parser.minimalASS;
  },

  INIT_SUBTITLE_RENDERER: async ({ dispatch }, ass) => {
    console.debug('INIT_SUBTITLE_RENDERER');
    const libjass = await import('synclounge-libjass');
    subtitleRenderer = new libjass.renderers.WebRenderer(
      ass,
      await dispatch('GET_OR_MAKE_VIDEO_CLOCK'),
      document.createElement('div'),
      subtitleSettings,
    );

    insertElementBeforeVideo(subtitleRenderer.libjassSubsWrapper);
  },

  SET_SUBTITLE_URL: async ({ dispatch }) => {
    await dispatch('DESTROY_ASS');

    try {
      const ass = await dispatch('MAKE_ASS');

      if (subtitleRenderer) {
        // eslint-disable-next-line no-underscore-dangle
        subtitleRenderer._ass = ass;
      } else {
        await dispatch('INIT_SUBTITLE_RENDERER', ass);
      }

      await dispatch('PUBLISH_SUBTITLE_SIZE');
      await dispatch('RERENDER_SUBTITLE_CONTAINER');
    } catch (e) {
      if (assAbortController) {
        // If there is no abort controller, we have just aborted
        // If there is one, then something went wrong
        throw e;
      }
    }
  },

  DESTROY_SUBTITLES: async ({ dispatch }) => {
    if (videoClock) {
    // eslint-disable-next-line no-underscore-dangle
      videoClock._autoClock._manualClock._eventListeners.clear();
    }

    await dispatch('DESTROY_ASS');

    if (subtitleRenderer) {
      subtitleRenderer.libjassSubsWrapper.remove();
      subtitleRenderer = null;
    }

    videoClock = null;
  },

  CHANGE_SUBTITLE_COLOR: async ({ commit, dispatch }, color) => {
    commit('SET_SUBTITLE_COLOR', color);
    await dispatch('RERENDER_SUBTITLE_CONTAINER');
  },

  CHANGE_SUBTITLE_POSITION: async ({ commit, dispatch }, position) => {
    commit('SET_SUBTITLE_POSITION', position);
    await dispatch('RERENDER_SUBTITLE_CONTAINER');
  },

  CHANGE_SUBTITLE_SIZE: async ({ commit, dispatch }, size) => {
    commit('SET_SUBTITLE_SIZE', size);
    await dispatch('PUBLISH_SUBTITLE_SIZE');
    await dispatch('RERENDER_SUBTITLE_CONTAINER');
  },

  CHANGE_SUBTITLE_OFFSET: async ({
    getters, rootGetters, commit, dispatch,
  }, offsetIncrement) => {
    console.debug('CHANGE_SUBTITLE_OFFSET', offsetIncrement);
    if (offsetIncrement === 0) {
      // Reset
      commit('SET_SUBTITLE_OFFSET', 0);
    } else {
      commit('SET_SUBTITLE_OFFSET', getters.GET_SUBTITLE_OFFSET + offsetIncrement);
    }

    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock.seeking();

    // TODO: give this a signal
    await dispatch('plexservers/UPDATE_STREAM', {
      machineIdentifier: rootGetters['plexclients/GET_ACTIVE_SERVER_ID'],
      id: getters.GET_SUBTITLE_STREAM.id,
      offset: getters.GET_SUBTITLE_OFFSET,
    }, { root: true });
  },
};
