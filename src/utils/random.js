// References:
// https://crypto.stackexchange.com/questions/8826/map-bytes-to-number
// https://crypto.stackexchange.com/a/5721
// https://dimitri.xyz/random-ints-from-random-bits/

const MAX_CHARSET_SIZE = 0x10000;
const alphanumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const max = MAX_CHARSET_SIZE - (MAX_CHARSET_SIZE % alphanumericCharacters.length);

export const randomAlphanumericString = (length) => {
  let randomString = '';
  const numUint16Elements = Math.ceil(1.1 * length);

  while (randomString.length < length) {
    const array = new Uint16Array(numUint16Elements);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < array.length && randomString.length < length; i += 1) {
      const digit = array[i];
      if (digit <= max) {
        const newChar = alphanumericCharacters[digit % alphanumericCharacters.length];
        randomString += newChar;
      }
    }
  }

  return randomString;
};

const roomIdLength = 5;

export const getRandomRoomId = () => randomAlphanumericString(roomIdLength);

const plexIdLength = 24;

export const getRandomPlexId = () => randomAlphanumericString(plexIdLength);
