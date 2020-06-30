import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import store from '@/store';

class CloseButton extends shaka.ui.Element {
  constructor(parent, controls) {
    super(parent, controls);

    // The actual button that will be displayed
    this.button = document.createElement('button');
    this.button.classList.add('shaka-close-button');
    this.button.classList.add('shaka-slplayer-button');
    this.button.classList.add('material-icons-round');
    this.button.textContent = 'close';
    this.parent.appendChild(this.button);

    // Listen for clicks on the button to start the next playback
    this.eventManager.listen(this.button, 'click', () => {
      store.dispatch('slplayer/PRESS_STOP');
    });
  }
}

const factory = {
  create: (rootElement, controls) => new CloseButton(rootElement, controls),
};

shaka.ui.Controls.registerElement('close', factory);
