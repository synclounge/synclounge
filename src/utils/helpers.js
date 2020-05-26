module.exports = {
  generateGuid: () => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return `${s4() + s4()}-${s4()}${s4()}`;
  },

  coalesce: (...arr) => {
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      if (arr[i] !== null && arr[i] !== undefined) {
        return arr[i];
      }
    }
    return null;
  },
};
