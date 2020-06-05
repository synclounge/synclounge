export default {
  getTitle: (metadata) => {
    switch (metadata.type) {
      case 'movie':
        return metadata.title;

      case 'show':
        return metadata.title;

      case 'season':
        return metadata.title;

      case 'episode':
        return metadata.grandparentTitle;

      default:
        return metadata.title;
    }
  },

  getSecondaryTitle: (metadata) => {
    switch (metadata.type) {
      case 'movie':
        return metadata.year;

      case 'show':
        return `${metadata.childCount} ${metadata.childCount === 1 ? 'season' : 'seasons'}`;

      case 'season':
        return `${metadata.leafCount} episodes`;

      case 'album':
        return metadata.year;

      case 'artist':
        return '';

      case 'episode':
        return `S${
          metadata.parentIndex
        }E${
          metadata.index
        } - ${
          metadata.title}`;

      default:
        return metadata.title;
    }
  },
};