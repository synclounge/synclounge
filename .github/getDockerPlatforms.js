const { readFileSync } = require('fs');
const { execSync } = require('child_process');

const fromRegex = /^\s*FROM\s+(?:--platform\=\S+\s+)?(?<tag>\S+)\s+as\s+(?<alias>\S+)\s*$/mg

const findLastFromLineIndex = (lines) => lines.reduce((acc, line, index) => (
  line.startsWith('FROM') ? index : acc
), 0);

const findBaseImage = (fromGroups, tag) => {
  const origin = fromGroups.find((group) => group.alias === tag);
  return origin
    ? findBaseImage(fromGroups, origin.tag)
    : tag;
};

const getDockerfileImage = (file) => {
  const lines = readFileSync(file, { encoding: 'utf8' });

  const matches = [...lines.matchAll(fromRegex)];
  const fromGroups = matches.map((match) => match.groups);

  const lastTag = fromGroups[fromGroups.length - 1].tag;
  return findBaseImage(fromGroups, lastTag);
};

const getImageManifest = (image) => execSync(`docker manifest inspect ${image}`, {
  encoding: 'utf8',
});

const translateManifestPlatform = ({ os, architecture, variant }) => (variant
  ? `${os}/${architecture}/${variant}`
  : `${os}/${architecture}`);

const getImagePlatforms = (image) => JSON.parse(getImageManifest(image)).manifests
  .map(({ platform }) => translateManifestPlatform(platform));

const getDockerfileArches = (file, supportedPlatformsStr) => {
  const basePlatforms = getImagePlatforms(getDockerfileImage(file));
  console.log('Base platforms: ', basePlatforms.join(', '));
  const supportedPlatforms = supportedPlatformsStr.split(',');
  return basePlatforms.filter(
    (platform) => supportedPlatforms.some((supPlatform) => platform.startsWith(supPlatform)),
  ).join(',');
}

module.exports = getDockerfileArches;
