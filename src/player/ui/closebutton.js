import shaka from 'shaka-player/dist/shaka-player.ui.debug';

class CloseButton extends shaka.ui.Element {
  constructor(parent, controls, eventBus) {
    super(parent, controls);
    this.eventBus = eventBus;

    // The actual button that will be displayed
    this.button = document.createElement('button');
    this.button.classList.add('shaka-close-button');
    this.button.classList.add('material-icons');
    this.button.textContent = 'close';
    this.parent.appendChild(this.button);

    // Listen for clicks on the button to start the next playback
    this.eventManager.listen(this.button, 'click', () => {
      this.eventBus.$emit('playerclosebuttonclicked');
    });
  }
};


// Factory that will create a button at run time.
class CloseButtonFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  create(rootElement, controls) {
    return new CloseButton(rootElement, controls, this.eventBus);
  }
};

export default CloseButtonFactory;