/* eslint-disable import/prefer-default-export */
export const encodeUrlParams = params => Object.entries(params)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join('&');
