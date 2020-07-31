import { sample } from 'lodash-es';
import { fetchJson } from '@/utils/fetchutils';
import scoreMedia from './mediascoring';

export default {
  FETCH_RANDOM_ITEM: async ({ getters, dispatch }, machineIdentifier) => {
    // TODO: probably do this better and more random etc lol because sort order is the same I think
    await dispatch('FETCH_ALL_LIBRARIES_IF_NEEDED', machineIdentifier);
    const libraryKeys = getters.GET_PLEX_SERVER(machineIdentifier).libraries
      .map((library) => library.key);

    const libraryKey = sample(libraryKeys);

    const contents = await dispatch('FETCH_LIBRARY_CONTENTS', {
      machineIdentifier,
      sectionId: libraryKey,
      start: 0,
      size: 50,
    });

    return sample(contents);
  },

  FETCH_RANDOM_THUMB_URL: async ({ getters, dispatch }) => {
    await dispatch('plex/FETCH_PLEX_DEVICES_IF_NEEDED', null, { root: true });

    const machineIdentifier = sample(getters.GET_CONNECTABLE_PLEX_SERVER_IDS);
    if (!machineIdentifier) {
      throw new Error('No valid servers found');
    }

    const result = await dispatch('FETCH_RANDOM_ITEM', machineIdentifier);
    if (!result) {
      throw new Error('No result found');
    }

    return getters.GET_MEDIA_IMAGE_URL({
      machineIdentifier,
      mediaUrl: result.thumb,
      width: 900,
      height: 900,
      blur: 8,
    });
  },

  FETCH_PLEX_SERVER: ({ getters, rootGetters }, {
    machineIdentifier, path, params, ...rest
  }) => {
    const { accessToken, chosenConnection: { uri } } = getters.GET_PLEX_SERVER(machineIdentifier);
    return fetchJson(
      `${uri}${path}`, {
        ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](accessToken),
        ...params,
      }, rest,
    );
  },

  SEARCH_PLEX_SERVER: async ({ dispatch }, { query, machineIdentifier, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/search',
      params: {
        query,
      },
      signal,
    });

    if (!data.MediaContainer.Metadata) {
      return [];
    }

    return data.MediaContainer.Metadata.map((result) => ({
      ...result,
      machineIdentifier,
    }));
  },

  FETCH_PLEX_METADATA: async ({ dispatch }, { ratingKey, machineIdentifier, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/metadata/${ratingKey}`,
      params: {
        includeConcerts: 1,
        includeExtras: 1,
        includeOnDeck: 1,
        includePopularLeaves: 1,
        includePreferences: 1,
        includeChapters: 1,
        includeStations: 1,
        includeExternalMedia: 1,
        asyncAugmentMetadata: 1,
        asyncRefreshLocalMediaAgent: 1,
        asyncRefreshAnalysis: 1,
        checkFiles: 1,
        includeMarkers: 1,
      },
      signal,
    });

    // TODO: fix how I store markers

    return {
      ...data.MediaContainer.Metadata[0],
      Marker: data.MediaContainer.Marker,
      machineIdentifier,
    };
  },

  SEARCH_UNBLOCKED_PLEX_SERVERS: ({ getters, dispatch }, query) => Promise.allSettled(
    getters.GET_UNBLOCKED_PLEX_SERVER_IDS.map((machineIdentifier) => dispatch('SEARCH_PLEX_SERVER', {
      machineIdentifier,
      query,
    })),
  ).then((results) => results.filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)),

  FIND_BEST_MEDIA_MATCH: async ({ getters, dispatch }, hostTimeline) => {
    // If we have access the same server, play same content
    if (getters.IS_PLEX_SERVER_UNBLOCKED(hostTimeline.machineIdentifier)) {
      try {
        const metadata = await dispatch('FETCH_PLEX_METADATA', {
          ratingKey: hostTimeline.ratingKey,
          machineIdentifier: hostTimeline.machineIdentifier,
        });

        return {
          ...metadata,
          mediaIndex: hostTimeline.mediaIndex,
        };
        // eslint-disable-next-line no-empty
      } catch { }
    }

    const results = await dispatch('SEARCH_UNBLOCKED_PLEX_SERVERS', hostTimeline.title);
    if (results.length <= 0) {
      return null;
    }

    const bestResult = results.map((result) => ({
      result,
      score: scoreMedia(result, hostTimeline),
    }))
      .reduce((prev, current) => (prev.score > current.score ? prev : current)).result;

    const metadata = await dispatch('FETCH_PLEX_METADATA', {
      ratingKey: bestResult.ratingKey,
      machineIdentifier: bestResult.machineIdentifier,
    });

    return metadata;
  },

  FETCH_ON_DECK: async ({ dispatch }, {
    machineIdentifier, start, size, signal,
  }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/onDeck',
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
      },
      signal,
    });

    return data.MediaContainer.Metadata;
  },

  FETCH_ALL_LIBRARIES: async ({ dispatch, commit }, { machineIdentifier, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/sections',
      signal,
    });

    commit('SET_PLEX_SERVER_LIBRARIES', {
      machineIdentifier,
      libraries: data.MediaContainer.Directory,
    });
  },

  FETCH_ALL_LIBRARIES_IF_NEEDED: async ({ getters, dispatch }, machineIdentifier) => {
    if (!getters.GET_PLEX_SERVER(machineIdentifier).libraries) {
      // TODO: signal abort maybe?
      await dispatch('FETCH_ALL_LIBRARIES', { machineIdentifier });
    }
  },

  FETCH_RECENTLY_ADDED_MEDIA: async ({ dispatch }, { machineIdentifier, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/recentlyAdded',
      signal,
    });

    return data.MediaContainer.Metadata;
  },

  FETCH_MEDIA_CHILDREN: async ({ dispatch }, {
    machineIdentifier, ratingKey, start, size, excludeAllLeaves, signal,
  }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/metadata/${ratingKey}/children`,
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves,
      },
      signal,
    });

    return data.MediaContainer.Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  FETCH_SEASON: async ({ dispatch }, {
    machineIdentifier, ratingKey, start, size, excludeAllLeaves, signal,
  }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/metadata/${ratingKey}/children`,
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves,
      },
      signal,
    });

    // Add librarySectionID to all children
    return {
      ...data.MediaContainer,
      Metadata: data.MediaContainer.Metadata.map((child) => ({
        ...child,
        librarySectionID: data.MediaContainer.librarySectionID,
      })),
    };
  },

  FETCH_RELATED: async ({ dispatch }, {
    machineIdentifier, ratingKey, count, signal,
  }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/metadata/${ratingKey}/related`,
      params: {
        excludeFields: 'summary',
        count,
      },
      signal,
    });

    // TODO: potentially include the other hubs too (related director etc...)
    return data.MediaContainer.Hub[0].Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  FETCH_LIBRARY_CONTENTS: async ({ dispatch }, {
    machineIdentifier, sectionId, start, size, signal,
  }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/sections/${sectionId}/all`,
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves: 1,
      },
      signal,
    });

    return data.MediaContainer.Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  CREATE_PLAY_QUEUE: async ({ dispatch }, { machineIdentifier, ratingKey, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      method: 'POST',
      path: '/playQueues',
      params: {
        type: 'video',
        continuous: 1,
        uri: `server://${machineIdentifier}/com.plexapp.plugins.library/library/metadata/${ratingKey}`,
        own: 1,
        includeExternalMedia: 1,
        includeChapters: 1,
      },
      signal,
    });

    return data.MediaContainer;
  },

  FETCH_PLAY_QUEUE: async ({ dispatch }, { machineIdentifier, playQueueID, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/playQueues/${playQueueID}`,
      params: {
        own: 1,
        includeExternalMedia: 1,
        includeChapters: 1,

      },
      signal,
    });

    return data.MediaContainer;
  },

  MARK_WATCHED: ({ dispatch }, { machineIdentifier, ratingKey, signal }) => dispatch('FETCH_PLEX_SERVER', {
    machineIdentifier,
    path: '/:/scrobble',
    params: {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey,
    },
    signal,
  }),
};
