import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import ShakaUtils from '@/player/ui/utils';
import store from '@/store';

class AudioSelection extends shaka.ui.SettingsMenu {
  #watcherCancellers = [];

  constructor(parent, controls) {
    super(parent, controls, 'audiotrack');

    this.#watcherCancellers = [
      store.watch(
        (state, getters) => getters['slplayer/GET_AUDIO_STREAMS'],
        this.updateAudioSelection.bind(this),
      ),

      store.watch(
        (state, getters) => getters['slplayer/GET_AUDIO_STREAM_ID'],
        this.updateAudioSelection.bind(this),
      ),
    ];

    this.button.classList.add('shaka-audio-button');
    this.menu.classList.add('shaka-audio');

    this.backSpan.textContent = 'Audio';
    this.nameSpan.textContent = 'Audio';

    this.updateAudioSelection();
  }

  updateAudioSelection() {
    // Hide menu if no audio
    if (store.getters['slplayer/GET_AUDIO_STREAMS'].length <= 0) {
      ShakaUtils.setDisplay(this.menu, false);
      ShakaUtils.setDisplay(this.button, false);
      return;
    }

    // Otherwise, restore it.
    ShakaUtils.setDisplay(this.button, true);

    // Remove old shaka-resolutions
    // 1. Save the back to menu button
    const backButton = ShakaUtils.getFirstDescendantWithClassName(this.menu, 'shaka-back-to-overflow-button');

    // 2. Remove everything
    ShakaUtils.removeAllChildren(this.menu);

    // 3. Add the backTo Menu button back
    this.menu.appendChild(backButton);

    this.addAudioSelection();

    ShakaUtils.focusOnTheChosenItem(this.menu);
  }

  addAudioSelection() {
    store.getters['slplayer/GET_AUDIO_STREAMS'].forEach((audio) => {
      const button = document.createElement('button');
      button.classList.add('explicit-audio');

      const span = document.createElement('span');
      span.textContent = audio.text;
      button.appendChild(span);

      this.eventManager.listen(
        button,
        'click',
        () => this.onAudioClicked(audio.id),
      );

      if (audio.id === store.getters['slplayer/GET_AUDIO_STREAM_ID']) {
        button.setAttribute('aria-selected', 'true');
        button.appendChild(ShakaUtils.checkmarkIcon());
        span.classList.add('shaka-chosen-item');
        this.currentSelection.textContent = span.textContent;
      }

      this.menu.appendChild(button);
    });
  }

  onAudioClicked(audioId) {
    store.dispatch('slplayer/CHANGE_AUDIO_STREAM', audioId);
  }

  // TODO: replace this function name with "release" when upgrading to shaka 3
  destroy() {
    this.#watcherCancellers.forEach((canceller) => {
      canceller();
    });

    super.destroy();
  }
}

export default {
  create: (rootElement, controls) => new AudioSelection(rootElement, controls),
};
