// eslint-disable-next-line max-classes-per-file
import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import ShakaUtils from '@/player/ui/utils';

class AudioSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls, eventBus) {
    super(parent, controls, 'audiotrack');
    this.eventBus = eventBus;
    this.selectedAudioId = 0;
    this.audioStreams = [];
    this.eventListeners = [
      {
        event: 'audiotreamschanged',
        fn: this.onAudioStreamsChanged.bind(this),
      },
      {
        event: 'audiotreamidchanged',
        fn: this.onAudioStreamIdChanged.bind(this),
      },
    ];

    ShakaUtils.addEventListeners(this.eventListeners, this.eventBus);
    this.eventBus.$once(
      'slplayerdestroy',
      () => ShakaUtils.removeEventListeners(this.eventListeners, this.eventBus),
    );

    this.button.classList.add('shaka-audio-button');
    this.menu.classList.add('shaka-audio');

    this.backSpan.textContent = 'Audio';
    this.nameSpan.textContent = 'Audio';

    this.updateAudioSelection();
  }

  onAudioStreamsChanged(streams) {
    console.log('streams changed', streams);
    this.audioStreams = streams;
    this.updateAudioSelection();
  }

  onAudioStreamIdChanged(id) {
    if (id !== this.selectedAudioId) {
      this.selectedAudioId = id;
      this.updateAudioSelection();
    }
  }

  updateAudioSelection() {
    // Hide menu if no audio
    if (this.audioStreams.length <= 0) {
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
    this.audioStreams.forEach((audio) => {
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

      if (audio.id === this.selectedAudioId) {
        button.setAttribute('aria-selected', 'true');
        button.appendChild(ShakaUtils.checkmarkIcon());
        span.classList.add('shaka-chosen-item');
        this.currentSelection.textContent = span.textContent;
      }

      this.menu.appendChild(button);
    });
  }

  onAudioClicked(audioId) {
    this.eventBus.$emit('audiotreamselectionchanged', audioId);
  }
}

class AudioSelectionFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  create(rootElement, controls) {
    return new AudioSelection(rootElement, controls, this.eventBus);
  }
}

export default AudioSelectionFactory;
