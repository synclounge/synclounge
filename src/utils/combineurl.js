export const combineUrl = (url, base) => {
  // Make sure base ends in a /
  const fixedBase = base.charAt(base.length - 1) === '/'
    ? base
    : `${base}/`;

  return new URL(url, fixedBase);
};

export const combineRelativeUrlParts = (base, path) => (!base || base.charAt(base.length - 1) === '/'
  ? `${base}${path}`
  : `${base}/${path}`);
