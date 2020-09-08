const h264Profiles = {
  unknown: 0,
  simple: 66,
  base: 66,
  main: 77,
  high: 100,
  422: 122,
  high10: 110,
  444: 144,
  extended: 88,
  scalablebase: 83,
  scalablehigh: 86,
  multiviewhigh: 118,
  stereohigh: 128,
  constrainedbase: 256,
  ucconstrainedhigh: 257,
  ucscalableconstrainedbase: 258,
  ucscalableconstrainedhigh: 259,
};

const getH264Mime = (videoProfile, level) => {
  // https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
  // Making avc1.PPCCLL
  const profile = h264Profiles[videoProfile.toLowerCase()] || 0;
  const ppcc = profile.toString(16).padStart(2, '0').padEnd(4, '0');
  // Note: I'm ignoring the constraint_set flags because I appear I don't really need to set them
  // and it looks like the microsoft profiles may set them too

  const ee = level.toString(16).padStart(2, '0');

  return `video/mp4; codecs="avc1.${ppcc}${ee}"`;
};

export const isVideoSupported = ({ codec, profile, level }) => {
  console.log('isVideoSupported', codec);
  switch (codec) {
    case 'h264': {
      return MediaSource.isTypeSupported(getH264Mime(profile, level));
    }

    case 'av1': {
      // TODO: replace with proper AV1 mime type forming
      return MediaSource.isTypeSupported('video/mp4; codecs="av01.0.00M.08"');
    }

    default: {
      return MediaSource.isTypeSupported(`video/mp4; codecs="${codec}`);
    }
  }
};

const aacProfiles = {
  main: 1,
  lc: 2,
  ssr: 3,
  ltp: 4,
  sbr: 5,
  scalable: 6,
  // TODO: fill out the rest based on how plex reports the profiles
  ps: 29,
};

const getAACMime = (profile) => {
  const aacProfileNum = aacProfiles[profile] || 0;
  return `audio/mp4; codecs="mp4a.40.${aacProfileNum}"`;
};

export const isAudioSupported = ({ codec, profile }) => {
  console.log('isAudioSupported', codec);
  switch (codec) {
    case 'aac': {
      return MediaSource.isTypeSupported(getAACMime(profile));
    }

    default: {
      return MediaSource.isTypeSupported(`audio/mp4; codecs="${codec}`);
    }
  }
};

const supportedContainers = [
  'mp4',
  'webm',
  'ogg',
  'wav',
];

export const isContainerSupported = (container) => supportedContainers.includes(container);
