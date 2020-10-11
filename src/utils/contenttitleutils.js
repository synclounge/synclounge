const reasonWord = {
  section: 'in',
  actor: 'with',
  director: 'by',
};

export default {
  getTitle: (metadata, fullTitle) => {
    switch (metadata.type) {
      case 'movie':
        return metadata.title;

      case 'show':
        return metadata.title;

      case 'season':
        return fullTitle
          ? metadata.parentTitle
          : metadata.title;

      case 'episode':
        return fullTitle
          ? metadata.title
          : metadata.grandparentTitle;

      default:
        return metadata.title;
    }
  },

  getSecondaryTitle: (metadata, fullTitle) => {
    switch (metadata.type) {
      case 'movie':
        return metadata.year;

      case 'show':
        return `${metadata.childCount} ${metadata.childCount === 1 ? 'season' : 'seasons'}`;

      case 'season':
        return fullTitle
          ? metadata.title
          : `${metadata.leafCount} episodes`;

      case 'episode':
        return fullTitle
          ? `Episode ${metadata.index}`
          : `S${
            metadata.parentIndex
          }E${
            metadata.index
          } - ${
            metadata.title}`;

      default:
        return metadata.title;
    }
  },

  getCombinedTitle: ({
    type, grandparentTitle, title, parentIndex, index,
  }) => {
    switch (type) {
      case 'episode': {
        return `${grandparentTitle} - ${title} S${parentIndex}-E${index}`;
      }

      default: {
        return title;
      }
    }
  },

  getReasonTitle: ({ reason, reasonTitle }) => `${reasonWord[reason]} ${reasonTitle}`,
};
