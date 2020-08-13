import shaka from 'shaka-player/dist/shaka-player.ui.debug';

export default (store) => {
  class PreviousButton extends shaka.ui.Element {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls);

      // The actual button that will be displayed
      this.button = document.createElement('button');
      this.button.classList.add('shaka-nextbutton');
      this.button.classList.add('shaka-slplayer-button');
      this.button.classList.add('material-icons-round');
      this.button.textContent = 'skip_previous';
      this.parent.appendChild(this.button);

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['plexclients/ACTIVE_PLAY_QUEUE_PREVIOUS_ITEM_EXISTS'],
          this.updateButtonEnabled.bind(this),
        ),
      ];

      // Listen for clicks on the button to start the next playback
      this.eventManager.listen(this.button, 'click', () => {
        this.onClick();
      });

      this.eventManager.listen(this.controls, 'timeandseekrangeupdated', () => {
        this.updateButtonEnabled();
      });

      this.updateButtonEnabled();
    }

    // Updates whether this should be enabled or disabled depending on
    // if we are > or < 30 seconds from end of video
    updateButtonEnabled() {
      if (this.controls.getDisplayTime() < 6) {
        this.button.disabled = !store.getters['plexclients/ACTIVE_PLAY_QUEUE_PREVIOUS_ITEM_EXISTS'];
      } else if (this.button.disabled) {
        // Enable
        this.button.disabled = false;
      }
    }

    onClick() {
      if (this.video.currentTime < 6) {
        store.dispatch('slplayer/PLAY_PREVIOUS');
      } else {
        this.video.currentTime = 0;
      }
    }

    release() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.release();
    }
  }

  const factory = {
    create: (rootElement, controls) => new PreviousButton(rootElement, controls),
  };

  shaka.ui.Controls.registerElement('previous', factory);
};
