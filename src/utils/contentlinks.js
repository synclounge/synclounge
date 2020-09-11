const getContentLink = (metadata) => {
  switch (metadata.type) {
    case 'episode': {
      return {
        name: 'PlexEpisode',
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
        name: 'PlexSeason',
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
        name: 'PlexSeries',
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
        name: 'PlexMovie',
        params: {
          machineIdentifier: metadata.machineIdentifier,
          sectionId: metadata.librarySectionID,
          ratingKey: metadata.ratingKey,
        },
      };
    }
  }
};

export default getContentLink;
