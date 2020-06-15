// eslint-disable-next-line max-classes-per-file
import shaka from 'shaka-player/dist/shaka-player.ui.debug';

class Forward30Button extends shaka.ui.Element {
  constructor(parent, controls) {
    super(parent, controls);

    // The actual button that will be displayed
    this.button = document.createElement('button');
    this.button.classList.add('shaka-forward30-button');
    this.button.classList.add('shaka-slplayer-button');
    this.button.classList.add('material-icons');
    this.button.textContent = 'forward_30';
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
    this.video.currentTime += 30;
  }

  // Updates whether this should be enabled or disabled depending on
  // if we are > or < 30 seconds from end of video
  updateStatus() {
    if (this.video.duration - this.controls.getDisplayTime() <= 30) {
      // Disable
      if (!this.button.disabled) {
        this.button.disabled = true;
      }
    } else if (this.button.disabled) {
      // Enable
      this.button.disabled = false;
    }
  }
}

// Factory that will create a button at run time.
class Forward30ButtonFactory {
  create(rootElement, controls) {
    return new Forward30Button(rootElement, controls);
  }
}

export default Forward30ButtonFactory;
