const { readFileSync } = require('fs');
const { execSync } = require('child_process');

const findLastFromLineIndex = (lines) => lines.reduce((acc, line, index) => (
  line.startsWith('FROM') ? index : acc
), 0);

const getDockerfileImage = (file) => {
  const lines = readFileSync(file, { encoding: 'utf8' })
    .split('\n');

  const lastFromLine = lines[findLastFromLineIndex(lines)];
  return lastFromLine.split(' ')[1];
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
