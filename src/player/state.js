import resiliantStreamFactory from './streams';

let player = null;
let overlay = null;
let videoClock = null;
let subtitleRenderer = null;
let assAbortController = null;

const settings = {
  preciseOutlines: true,
};

export const getPlayer = () => player;
export const setPlayer = (newPlayer) => {
  player = newPlayer;
};

export const getOverlay = () => overlay;
export const setOverlay = (newOverlay) => {
  overlay = newOverlay;
};

// eslint-disable-next-line no-underscore-dangle
export const areControlsShown = () => !getOverlay() || (getOverlay()?.getControls().enabled_
    && (getOverlay()?.getControls().getControlsContainer().getAttribute('shown') != null
    || getOverlay()?.getControls().getControlsContainer().getAttribute('casting') != null));

export const getControlsOffset = (fallbackHeight) => (areControlsShown()
  ? (getPlayer()?.getMediaElement().offsetHeight || fallbackHeight) * 0.025 + 48 || 0
  : 0);

/**
 * Resize the subtitles to the dimensions of the video element.
 *
 * This method accounts for letterboxing if the video element's size is not the same ratio as the video resolution.
 */
export const resizeSubtitleContainer = () => {
  // Handle letterboxing around the video. If the width or height are greater than the video can be, then consider that dead space.
  if (!subtitleRenderer) {
    return;
  }

  const bottomOffset = getControlsOffset();
  console.debug('resizeSubtitleContainer', bottomOffset);

  const {
    videoWidth, videoHeight, offsetWidth, offsetHeight,
  } = getPlayer().getMediaElement();

  const ratio = Math.min(offsetWidth / videoWidth, (offsetHeight - bottomOffset) / videoHeight);
  const subsWrapperWidth = videoWidth * ratio;
  const subsWrapperHeight = videoHeight * ratio;
  const subsWrapperLeft = (offsetWidth - subsWrapperWidth) / 2;
  const subsWrapperTop = ((offsetHeight - bottomOffset) - subsWrapperHeight) / 2;

  subtitleRenderer.resize(subsWrapperWidth, subsWrapperHeight, subsWrapperLeft, subsWrapperTop);
};

const synchronizeClock = () => {
  if (getPlayer().getMediaElement().paused && !videoClock.paused) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock.pause();
  } else if (!getPlayer().getMediaElement().paused && videoClock.paused) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock.play();
  }

  if (getPlayer().getMediaElement().playbackRate && !videoClock.rate) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock.setRate(getPlayer().getMediaElement().playbackRate);
  }

  if (getPlayer().getMediaElement().currentTime && !videoClock.currentTime) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock.seeking();
  }
};

const getOrMakeVideoClock = async () => {
  const libjass = await import('libjass');
  if (!videoClock) {
    videoClock = new libjass.renderers.VideoClock(getPlayer().getMediaElement());
  }

  synchronizeClock();

  return videoClock;
};

const initRenderer = async (ass) => {
  const libjass = await import('libjass');
  subtitleRenderer = new libjass.renderers.WebRenderer(
    ass,
    await getOrMakeVideoClock(),
    document.createElement('div'),
    settings,
  );

  const parent = getPlayer().getMediaElement().parentNode;

  parent.insertBefore(
    subtitleRenderer.libjassSubsWrapper,
    getPlayer().getMediaElement(),
  );

  resizeSubtitleContainer();
};

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

const makeAss = async (url) => {
  console.debug('makeAss');
  const libjass = await import('libjass');
  assAbortController = new AbortController();
  const stream = resiliantStreamFactory(url, assAbortController.signal);

  const parser = new libjass.parser.StreamParser(stream);
  // Purposefully not awaited because we never get the full file at once
  // We still need to catch abort errors to clean up console
  handleStreamError(parser.ass);
  return parser.minimalASS;
};

export const destroyAss = () => {
  if (assAbortController) {
    console.debug('destroyAss');
    assAbortController.abort();
    assAbortController = null;

    if (subtitleRenderer) {
      // It's possible we haven't finished making the renderer
    // eslint-disable-next-line no-underscore-dangle
      subtitleRenderer._ass._dialogues = [];
      // eslint-disable-next-line no-underscore-dangle
      subtitleRenderer._ass._attachments = [];

      // Resizing clears out rendered subtitles
      resizeSubtitleContainer();
    }
  }
};

export const setSubtitleUrl = async (url) => {
  destroyAss();

  try {
    const ass = await makeAss(url);

    if (subtitleRenderer) {
      // eslint-disable-next-line no-underscore-dangle
      subtitleRenderer._ass = ass;
      resizeSubtitleContainer();
    } else {
      await initRenderer(ass);
    }
  } catch (e) {
    if (assAbortController) {
      // If there is no abort controller, we have just aborted
      // If there is one, then something went wrong
      throw e;
    }
  }
};

export const destroySubtitles = () => {
  if (videoClock) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock._manualClock._eventListeners.clear();
  }

  destroyAss();

  if (subtitleRenderer) {
    subtitleRenderer.libjassSubsWrapper.remove();
    subtitleRenderer = null;
  }

  videoClock = null;
};
