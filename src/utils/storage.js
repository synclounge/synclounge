export const get = (key) => {
  const string = window.localStorage.getItem(key);
  try {
    return JSON.parse(string);
  } catch (e) {
    return null;
  }
};

export const set = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export default {
  get,
  set,
};
