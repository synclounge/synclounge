import { combineRelativeUrl } from '@/utils/combineurl';

let player = null;
let overlay = null;
let subtitleOctopusFactory = null;
let subtitleOctopusInstance = null;

export const getPlayer = () => player;
export const setPlayer = (newPlayer) => {
  player = newPlayer;
};

export const getOverlay = () => overlay;
export const setOverlay = (newOverlay) => {
  overlay = newOverlay;
};

export const setSubtitleOctopusFactory = (newFactory) => {
  subtitleOctopusFactory = newFactory;
};

const getSubtitleOctopusInstance = () => subtitleOctopusInstance;
const makeSubtitleOctopusInstance = (options) => {
  console.log('media element', getPlayer().getMediaElement());
  subtitleOctopusInstance = subtitleOctopusFactory({
    video: getPlayer().getMediaElement(),
    workerUrl: combineRelativeUrl('libraries/subtitles-octopus-worker.js', process.env.BASE_URL),
    legacyWorkerUrl: combineRelativeUrl('libraries/subtitles-octopus-worker-legacy.js', process.env.BASE_URL),
    debug: true,
    ...options,
  });
};

export const setSubtitleContent = (subContent) => {
  if (getSubtitleOctopusInstance()) {
    // If subtitles enabled, get stream thing
    getSubtitleOctopusInstance().setTrack(subContent);
  } else {
    makeSubtitleOctopusInstance({
      subContent,
    });
  }
};

export const setSubtitleUrl = (subUrl) => {
  if (getSubtitleOctopusInstance()) {
    // If subtitles enabled, get stream thing
    getSubtitleOctopusInstance().setTrackByUrl(subUrl);
  } else {
    makeSubtitleOctopusInstance({
      subUrl,
    });
  }
};

export const removeSubtitles = () => {
  if (getSubtitleOctopusInstance()) {
    getSubtitleOctopusInstance().freeTrack();
  }
};

export const disposeSubtitleOctopusInstance = () => {
  if (subtitleOctopusInstance != null) {
    subtitleOctopusInstance.dispose();
    subtitleOctopusInstance = null;
  }
};
