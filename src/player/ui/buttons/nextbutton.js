import shaka from 'shaka-player/dist/shaka-player.ui.debug';

export default (store) => {
  class NextButton extends shaka.ui.Element {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls);

      // The actual button that will be displayed
      this.button = document.createElement('button');
      this.button.classList.add('shaka-nextbutton');
      this.button.classList.add('shaka-slplayer-button');
      this.button.classList.add('material-icons-round');
      this.button.textContent = 'skip_next';
      this.parent.appendChild(this.button);

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['plexclients/ACTIVE_PLAY_QUEUE_NEXT_ITEM_EXISTS'],
          this.updateButtonEnabled.bind(this),
        ),
      ];

      // Listen for clicks on the button to start the next playback
      this.eventManager.listen(this.button, 'click', () => {
        // TODO: maybe await and lock this one at a time?
        store.dispatch('slplayer/PLAY_NEXT');
      });

      this.updateButtonEnabled();
    }

    updateButtonEnabled() {
      this.button.disabled = !store.getters['plexclients/ACTIVE_PLAY_QUEUE_NEXT_ITEM_EXISTS'];
    }

    // TODO: replace this function name with "release" when upgrading to shaka 3
    destroy() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.destroy();
    }
  }

  const factory = {
    create: (rootElement, controls) => new NextButton(rootElement, controls),
  };

  shaka.ui.Controls.registerElement('next', factory);
};
