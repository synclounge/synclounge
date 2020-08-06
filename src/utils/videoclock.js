/* eslint-disable no-underscore-dangle */
/**
 * An implementation of libjass.renderers.Clock that generates {@link libjass.renderers.ClockEvent}s according to the state of a <video> element.
 *
 * @param {!HTMLVideoElement} video
 */
export default class VideoClock {
  constructor(video, autoClock) {
    this._autoClock = autoClock;
    video.addEventListener('playing', () => this._autoClock.play(), false);
    video.addEventListener('pause', () => this._autoClock.pause(), false);
    video.addEventListener('seeking', () => this._autoClock.seeking(), false);
    video.addEventListener('ratechange', () => this._autoClock.setRate(video.playbackRate), false);
  }

  /**
   * @type {number}
   */
  get currentTime() {
    return this._autoClock.currentTime;
  }

  /**
   * @type {boolean}
   */
  get enabled() {
    return this._autoClock.enabled;
  }

  /**
   * @type {boolean}
   */
  get paused() {
    return this._autoClock.paused;
  }

  /**
   * Gets the rate of the clock - how fast the clock ticks compared to real time.
   *
   * @type {number}
   */
  get rate() {
    return this._autoClock.rate;
  }

  /**
   * Enable the clock.
   *
   * @return {boolean} True if the clock is now enabled, false if it was already enabled.
   */
  enable() {
    return this._autoClock.enable();
  }

  /**
   * Disable the clock.
   *
   * @return {boolean} True if the clock is now disabled, false if it was already disabled.
   */
  disable() {
    return this._autoClock.disable();
  }

  /**
   * Toggle the clock.
   */
  toggle() {
    if (this._autoClock.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Enable or disable the clock.
   *
   * @param {boolean} enabled If true, the clock is enabled, otherwise it's disabled.
   * @return {boolean} True if the clock is now in the given state, false if it was already in that state.
   */
  setEnabled(enabled) {
    if (enabled) {
      return this.enable();
    }

    return this.disable();
  }

  /**
   * @param {number} type
   * @param {!Function} listener
   */
  addEventListener(type, listener) {
    this._autoClock.addEventListener(type, listener);
  }
}
