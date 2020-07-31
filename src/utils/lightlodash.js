export const sample = (arr) => {
  const len = arr == null ? 0 : arr.length;
  return len ? arr[Math.floor(Math.random() * len)] : undefined;
};

export const difference = (arrays) => arrays.reduce((a, b) => a.filter((c) => !b.includes(c)));

export const intersection = (arrays) => arrays.reduce((a, b) => a.filter((c) => b.includes(c)));

export const debounce = (func, wait, immediate) => {
  let timeout;
  return function debouncedFunc(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(context, ...args);
    }, wait);
    if (immediate && !timeout) func.apply(context, ...args);
  };
};
