export default {
  getContentLink: (metadata) => {
    switch (metadata.type) {
      case 'episode': {
        return {
          name: 'content',
          params: {
            machineIdentifier: metadata.machineIdentifier,
            sectionId: metadata.librarySectionID,
            grandparentRatingKey: metadata.grandparentRatingKey,
            parentRatingKey: metadata.parentRatingKey,
            ratingKey: metadata.ratingKey,
          },
        };
      }

      case 'season': {
        return {
          name: 'season',
          params: {
            machineIdentifier: metadata.machineIdentifier,
            sectionId: metadata.librarySectionID,
            parentRatingKey: metadata.parentRatingKey,
            ratingKey: metadata.ratingKey,
          },
        };
      }

      case 'series':
      case 'show': {
        return {
          name: 'series',
          params: {
            machineIdentifier: metadata.machineIdentifier,
            sectionId: metadata.librarySectionID,
            ratingKey: metadata.ratingKey,
          },
        };
      }

      // Movie or other type
      case 'movie':
      default: {
        return {
          name: 'movie',
          params: {
            machineIdentifier: metadata.machineIdentifier,
            sectionId: metadata.librarySectionID,
            ratingKey: metadata.ratingKey,
          },
        };
      }
    }
  },
};
