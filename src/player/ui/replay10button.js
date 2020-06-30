import shaka from 'shaka-player/dist/shaka-player.ui.debug';

class Replay10Button extends shaka.ui.Element {
  constructor(parent, controls) {
    super(parent, controls);

    // The actual button that will be displayed
    this.button = document.createElement('button');
    this.button.classList.add('shaka-replay10-button');
    this.button.classList.add('shaka-slplayer-button');
    this.button.classList.add('material-icons-round');
    this.button.textContent = 'replay_10';
    this.parent.appendChild(this.button);

    // Listen for clicks on the button to start the next playback
    this.eventManager.listen(this.button, 'click', () => {
      this.onButtonClicked();
    });

    this.eventManager.listen(this.controls, 'timeandseekrangeupdated', () => {
      this.updateStatus();
    });
  }

  onButtonClicked() {
    this.video.currentTime -= 10;
  }

  // Updates whether this should be enabled or disabled depending on
  // if we are > or < 30 seconds from end of video
  updateStatus() {
    if (this.controls.getDisplayTime() > 10) {
      if (this.button.disabled) {
        // Enable
        this.button.disabled = false;
      }
    } else if (!this.button.disabled) {
      // Disable
      this.button.disabled = true;
    }
  }
}

const factory = {
  create: (rootElement, controls) => new Replay10Button(rootElement, controls),
};

shaka.ui.Controls.registerElement('replay10', factory);
