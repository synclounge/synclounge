import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import SubtitlesOctopus from 'libass-wasm';
import store from '@/store';
import playerUiPlugins from '@/player/ui';

import {
  getPlayer, setPlayer, getOverlay, setOverlay, setSubtitleOctopusFactory,
} from './state';

playerUiPlugins(store);

shaka.log.setLevel(shaka.log.Level.ERROR);
shaka.polyfill.installAll();

const initialize = async ({
  mediaElement, playerConfig, videoContainer, overlayConfig,
}) => {
  setPlayer(new shaka.Player());
  await getPlayer().attach(mediaElement, false);
  getPlayer().configure(playerConfig);

  setOverlay(new shaka.ui.Overlay(getPlayer(), videoContainer, mediaElement));
  getOverlay().configure(overlayConfig);

  setSubtitleOctopusFactory((options) => new SubtitlesOctopus(options));
};

export default initialize;
