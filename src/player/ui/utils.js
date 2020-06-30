/**
   * Depending on the value of display, sets/removes the css class of element to
   * either display it or hide it.
   *
   * @param {Element} element
   * @param {boolean} display
   */
export const setDisplay = (element, display) => {
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
};

/**
   * @param {!HTMLElement} element
   * @param {string} className
   * @return {?HTMLElement}
   */
export const getDescendantIfExists = (element, className) => {
  const childrenWithClassName = element.getElementsByClassName(className);
  if (childrenWithClassName.length) {
    return /** @type {!HTMLElement} */ (childrenWithClassName[0]);
  }

  return null;
};

/**
   * Remove all of the child nodes of an element.
   * @param {!Element} element
   * @export
   */
export const removeAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const checkmarkIcon = () => {
  const icon = document.createElement('i');
  icon.classList.add('material-icons-round');
  icon.classList.add('shaka-chosen-item');
  icon.textContent = 'done';
  // Screen reader should ignore icon text.
  icon.setAttribute('aria-hidden', 'true');
  return icon;
};

/**
   * Finds a descendant of |menu| that has a 'shaka-chosen-item' class
   * and focuses on its' parent.
   *
   * @param {HTMLElement} menu
   */
export const focusOnTheChosenItem = (menu) => {
  if (!menu) {
    return;
  }

  const chosenItem = getDescendantIfExists(menu, 'shaka-chosen-item');
  if (chosenItem) {
    chosenItem.parentElement.focus();
  }
};
