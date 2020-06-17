export default {
  getAppWidth: () => Math.round(Math.max(document.documentElement.clientWidth,
    window.innerWidth || 0)),

  getAppHeight: () => Math.round(Math.max(document.documentElement.clientHeight,
    window.innerHeight || 0)),
};
