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

// from http://www.w3.org/TR/WCAG20/#relativeluminancedef
const relativeLuminanceW3C = (R8bit, G8bit, B8bit) => {
  const RsRGB = R8bit / 255;
  const GsRGB = G8bit / 255;
  const BsRGB = B8bit / 255;

  const R = (RsRGB <= 0.03928) ? RsRGB / 12.92 : ((RsRGB + 0.055) / 1.055) ** 2.4;
  const G = (GsRGB <= 0.03928) ? GsRGB / 12.92 : ((GsRGB + 0.055) / 1.055) ** 2.4;
  const B = (BsRGB <= 0.03928) ? BsRGB / 12.92 : ((BsRGB + 0.055) / 1.055) ** 2.4;

  // For the sRGB colorspace, the relative luminance of a color is defined as:
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  return L;
};

// https://stackoverflow.com/a/3943023
export const getBestOutlineColor = ({ red, green, blue }) => (
  relativeLuminanceW3C(red, green, blue) > 0.179
    ? subtitleColors.Black
    : subtitleColors.White);

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
