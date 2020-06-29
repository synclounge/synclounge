// eslint-disable-next-line max-classes-per-file
import shaka from 'shaka-player/dist/shaka-player.ui.debug';

class NextButton extends shaka.ui.Element {
  #watcherCancellers = [];

  constructor(parent, controls) {
    super(parent, controls);
    console.log(this);
    // The actual button that will be displayed
    this.button = document.createElement('button');
    this.button.classList.add('shaka-nextbutton');
    this.button.classList.add('material-icons-round');
    this.button.textContent = 'skip_next';
    this.parent.appendChild(this.button);
    const store = null;
    this.#watcherCancellers = [
      store.watch(
        (state, getters) => getters['plexservers/lol'],
        () => {},
      ),
    ];

    // Listen for clicks on the button to start the next playback
    this.eventManager.listen(this.button, 'click', () => {
      console.log('click');
    });
  }

  // TODO: replace this function name with "release" when upgrading to shaka 3
  destroy() {
    console.log('NEXT BUTTON RELEASE CALLED');
    super.destroy();
  }
}

// Factory that will create a button at run time.
class NextButtonFactory {
  create(rootElement, controls) {
    return new NextButton(rootElement, controls, this.eventBus);
  }
}

export default NextButtonFactory;
