export default () => {
  const sUsrAg = navigator.userAgent;
  if (sUsrAg.indexOf('Chrome') > -1) {
    return 'Chrome';
  } else if (sUsrAg.indexOf('Safari') > -1) {
    return 'Safari';
  } else if (sUsrAg.indexOf('Opera') > -1) {
    return 'Opera';
  } else if (sUsrAg.indexOf('Firefox') > -1) {
    return 'Firefox';
  } else if (sUsrAg.indexOf('MSIE') > -1) {
    return 'Microsoft Internet Explorer';
  }
  return '';
};
