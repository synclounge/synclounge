export const getAppWidth = () => Math.round(Math.max(
  document.documentElement.clientWidth,
  window.innerWidth || 0,
));

export const getAppHeight = () => Math.round(Math.max(
  document.documentElement.clientHeight,
  window.innerHeight || 0,
));
