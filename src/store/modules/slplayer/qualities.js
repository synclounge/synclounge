const makeQualityTemplate = (label, maxVideoBitrate) => ({
  label, maxVideoBitrate,
});

// eslint-disable-next-line import/prefer-default-export
const qualities = [
  makeQualityTemplate('Original', null),
  makeQualityTemplate('20 Mbps 1080p', 20000),
  makeQualityTemplate('12 Mbps 1080p', 12000),
  makeQualityTemplate('10 Mbps 1080p', 10000),
  makeQualityTemplate('8 Mbps 1080p', 8000),
  makeQualityTemplate('4 Mbps 720p', 4000),
  makeQualityTemplate('3 Mbps 720p', 3000),
  makeQualityTemplate('2 Mbps 720p', 2000),
  makeQualityTemplate('1.5 Mbps 480p', 1500),
  makeQualityTemplate('720 Kbps', 720),
  makeQualityTemplate('320 Kbps', 320),
  makeQualityTemplate('208 Kbps', 208),
  makeQualityTemplate('96 Kbps', 96),
  makeQualityTemplate('64 Kbps', 64),
];

export default qualities;
