export const combineAbsoluteUrl = (url, base) => {
  // Make sure base ends in a /
  const fixedBase = base.charAt(base.length - 1) === '/'
    ? base
    : `${base}/`;

  return new URL(url, fixedBase);
};

export const combineRelativeUrl = (url, base) => (base.charAt(base.length - 1) === '/'
  ? `${base}${url}`
  : `${base}/${url}`);
