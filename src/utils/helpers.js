export const generateGuid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}${s4()}`;
};


export const coalesce = () => {
  const len = arguments.length;
  for (let i = 0; i < len; i++) {
    if (arguments[i] !== null && arguments[i] !== undefined) {
      return arguments[i];
    }
  }
  return null;
}


export default {
  generateGuid,
};
