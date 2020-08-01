export const subtitleSettings = {
  preciseOutlines: true,
};

export const subtitlePositions = {
  Top: 8,
  Middle: 5,
  Bottom: 2,
};

export const subtitleSizes = {
  Tiny: 0.5,
  Small: 0.75,
  Normal: 1,
  Large: 1.25,
  Huge: 2,
};

export const subtitleColors = {
  White: 'FFFFFF',
  Yellow: 'FFEE00',
  Black: '000000',
  Cyan: '00FFFF',
  Blue: '0000FF',
  Green: '00FF00',
  Magenta: 'EE00EE',
  Red: 'FF0000',
  Gray: '808080',
};

export const hexToLibjassColor = async (hex) => {
  const libjass = await import('libjass');

  const aRgbHex = hex.match(/.{1,2}/g);

  return new libjass.parts.Color(
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16),
    1,
  );
};
