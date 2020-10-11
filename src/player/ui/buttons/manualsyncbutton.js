import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import { setDisplay } from '@/player/ui/utils';

export default (store) => {
  class ManualSyncButton extends shaka.ui.Element {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls);

      // The actual button that will be displayed
      this.button = document.createElement('button');
      this.button.classList.add('shaka-manualsync-button');
      this.button.classList.add('shaka-slplayer-button');
      this.button.classList.add('material-icons-round');
      this.button.textContent = 'sync';
      this.parent.appendChild(this.button);

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['synclounge/AM_I_HOST'],
          this.updateButtonDisplay.bind(this),
        ),
      ];

      // Listen for clicks on the button to start the next playback
      this.eventManager.listen(this.button, 'click', () => {
        store.dispatch('synclounge/MANUAL_SYNC');
      });

      this.updateButtonDisplay();
    }

    updateButtonDisplay() {
      setDisplay(this.button, !store.getters['synclounge/AM_I_HOST']);
    }

    release() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.release();
    }
  }

  const factory = {
    create: (rootElement, controls) => new ManualSyncButton(rootElement, controls),
  };

  shaka.ui.Controls.registerElement('manual_sync', factory);
};
