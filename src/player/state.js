import libjass from 'libjass';

import resiliantStreamFactory from './streams';

libjass.debugMode = true;

let player = null;
let overlay = null;
let videoClock = null;
let subtitleRenderer = null;
let assAbortController = null;

const settings = {
  preciseOutlines: true,
  preRenderTime: 20,
};

export const getPlayer = () => player;
export const setPlayer = (newPlayer) => {
  player = newPlayer;
};

export const getOverlay = () => overlay;
export const setOverlay = (newOverlay) => {
  overlay = newOverlay;
};

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

  const {
    videoWidth, videoHeight, offsetWidth, offsetHeight,
  } = getPlayer().getMediaElement();

  const ratio = Math.min(offsetWidth / videoWidth, offsetHeight / videoHeight);
  const subsWrapperWidth = videoWidth * ratio;
  const subsWrapperHeight = videoHeight * ratio;
  const subsWrapperLeft = (offsetWidth - subsWrapperWidth) / 2;
  const subsWrapperTop = (offsetHeight - subsWrapperHeight) / 2;

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

const getOrMakeVideoClock = () => {
  if (!videoClock) {
    videoClock = new libjass.renderers.VideoClock(getPlayer().getMediaElement());
  }

  synchronizeClock();

  return videoClock;
};

const initRenderer = (ass) => {
  subtitleRenderer = new libjass.renderers.WebRenderer(
    ass,
    getOrMakeVideoClock(),
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

const makeAss = (url) => {
  assAbortController = new AbortController();
  const stream = resiliantStreamFactory(url, assAbortController.signal);
  const parser = new libjass.parser.StreamParser(stream);
  return parser.minimalASS;
};

export const destroyAss = () => {
  if (assAbortController) {
    assAbortController.abort();
    assAbortController = null;
  }
};

export const setSubtitleUrl = async (url) => {
  destroyAss();

  const ass = await makeAss(url);

  if (subtitleRenderer) {
    // TODO: see if this is at right place
    // eslint-disable-next-line no-underscore-dangle
    subtitleRenderer._ass = ass;
  } else {
    initRenderer(ass);
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
