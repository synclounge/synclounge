class ShakaUtils {
  /**
   * Depending on the value of display, sets/removes the css class of element to
   * either display it or hide it.
   *
   * @param {Element} element
   * @param {boolean} display
   */
  static setDisplay(element, display) {
    if (!element) {
      return;
    }

    if (display) {
      // Removing a non-existent class doesn't throw, so, even if
      // the element is not hidden, this should be fine.
      element.classList.remove('shaka-hidden');
    } else {
      element.classList.add('shaka-hidden');
    }
  }

  /**
   * @param {!HTMLElement} element
   * @param {string} className
   * @return {!HTMLElement}
   */
  // TODO: This can be replaced by shaka.util.Dom.getElementByClassName
  static getFirstDescendantWithClassName(element, className) {
    return ShakaUtils.getDescendantIfExists(element, className);
  }

  /**
   * @param {!HTMLElement} element
   * @param {string} className
   * @return {?HTMLElement}
   */
  static getDescendantIfExists(element, className) {
    const childrenWithClassName = element.getElementsByClassName(className);
    if (childrenWithClassName.length) {
      return /** @type {!HTMLElement} */ (childrenWithClassName[0]);
    }

    return null;
  }

  /**
   * Remove all of the child nodes of an element.
   * @param {!Element} element
   * @export
   */
  static removeAllChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  static checkmarkIcon() {
    const icon = document.createElement('i');
    icon.classList.add('material-icons');
    icon.classList.add('shaka-chosen-item');
    icon.textContent = 'done';
    // Screen reader should ignore icon text.
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  /**
   * Finds a descendant of |menu| that has a 'shaka-chosen-item' class
   * and focuses on its' parent.
   *
   * @param {HTMLElement} menu
   */
  static focusOnTheChosenItem(menu) {
    if (!menu) {
      return;
    }
    const chosenItem = ShakaUtils.getDescendantIfExists(menu, 'shaka-chosen-item');
    if (chosenItem) {
      chosenItem.parentElement.focus();
    }
  }

  static addEventListeners(eventListeners, eventBus) {
    eventListeners.forEach(({ event, fn }) => {
      eventBus.$on(event, fn);
    });
  }

  static removeEventListeners(eventListeners, eventBus) {
    eventListeners.forEach(({ event, fn }) => {
      eventBus.$off(event, fn);
    });
  }
};

export default ShakaUtils;