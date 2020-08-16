import { sample, randomInt } from '@/utils/lightlodash';
import { fetchJson, queryFetch } from '@/utils/fetchutils';
import scoreMedia from './mediascoring';

export default {
  FETCH_RANDOM_ITEM: async ({ getters, dispatch }, { machineIdentifier, signal }) => {
    await dispatch('FETCH_ALL_LIBRARIES_IF_NEEDED', { machineIdentifier, signal });
    const libraryKeys = getters.GET_PLEX_SERVER(machineIdentifier).libraries
      .map((library) => library.key);

    const libraryKey = sample(libraryKeys);

    const librarySize = await dispatch('FETCH_LIBRARY_SIZE', {
      machineIdentifier, sectionId: libraryKey, signal,
    });
    const randomItemIndex = randomInt(librarySize - 1);

    const contents = await dispatch('FETCH_LIBRARY_CONTENTS', {
      machineIdentifier,
      sectionId: libraryKey,
      start: randomItemIndex,
      size: 1,
      signal,
    });

    return contents[0];
  },

  FETCH_RANDOM_IMAGE_URL: async ({ getters, dispatch }, signal) => {
    await dispatch('plex/FETCH_PLEX_DEVICES_IF_NEEDED', null, { root: true });

    const machineIdentifier = sample(getters.GET_CONNECTABLE_PLEX_SERVER_IDS);
    if (!machineIdentifier) {
      throw new Error('No valid servers found');
    }

    const result = await dispatch('FETCH_RANDOM_ITEM', { machineIdentifier, signal });
    if (!result) {
      throw new Error('No result found');
    }

    return getters.GET_MEDIA_IMAGE_URL({
      machineIdentifier,
      mediaUrl: result.art || result.thumb,
      width: window.screen.width,
      height: window.screen.height,
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

  QUERY_PLEX_SERVER: ({ getters, rootGetters }, {
    machineIdentifier, path, params, ...rest
  }) => {
    const { accessToken, chosenConnection: { uri } } = getters.GET_PLEX_SERVER(machineIdentifier);
    return queryFetch(
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

    return {
      ...data.MediaContainer.Metadata[0],
      machineIdentifier,
    };
  },

  SEARCH_UNBLOCKED_PLEX_SERVERS: ({ getters, dispatch }, query) => Promise.allSettled(
    getters.GET_UNBLOCKED_PLEX_SERVER_IDS.map((machineIdentifier) => dispatch(
      'SEARCH_PLEX_SERVER', {
        machineIdentifier,
        query,
      },
    )),
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
      } catch (e) {
        console.warn('Error fetching metadata for same media as host', e);
      }
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

  FETCH_ALL_LIBRARIES_IF_NEEDED: async ({ getters, dispatch }, { machineIdentifier, signal }) => {
    if (!getters.GET_PLEX_SERVER(machineIdentifier).libraries) {
      await dispatch('FETCH_ALL_LIBRARIES', { machineIdentifier, signal });
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
    return data.MediaContainer.Hub?.[0]?.Metadata?.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    })) || [];
  },

  FETCH_LIBRARY_ALL: async ({ dispatch }, {
    machineIdentifier, sectionId, start, size, signal,
  }) => {
    const { MediaContainer } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/sections/${sectionId}/all`,
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves: 1,
      },
      signal,
    });

    return MediaContainer;
  },

  FETCH_LIBRARY_CONTENTS: async ({ dispatch }, params) => {
    const { librarySectionID, Metadata } = await dispatch('FETCH_LIBRARY_ALL', params);

    return Metadata.map((child) => ({
      ...child,
      librarySectionID,
    }));
  },

  FETCH_LIBRARY_SIZE: async ({ dispatch }, { machineIdentifier, sectionId, signal }) => {
    const { totalSize } = await dispatch('FETCH_LIBRARY_ALL', {
      machineIdentifier,
      sectionId,
      start: 0,
      size: 0,
      signal,
    });

    return totalSize;
  },

  CREATE_PLAY_QUEUE: async ({ dispatch }, { machineIdentifier: id, ratingKey, signal }) => {
    const data = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier: id,
      method: 'POST',
      path: '/playQueues',
      params: {
        type: 'video',
        continuous: 1,
        uri: `server://${id}/com.plexapp.plugins.library/library/metadata/${ratingKey}`,
        repeat: 0,
        own: 1,
        includeChapters: 1,
        includeMarkers: 1,
        includeGeolocation: 1,
        includeExternalMedia: 1,
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
        includeChapters: 1,
        includeMarkers: 1,
        includeGeolocation: 1,
        includeExternalMedia: 1,
      },
      signal,
    });

    return data.MediaContainer;
  },

  MARK_WATCHED: ({ dispatch }, { machineIdentifier, ratingKey, signal }) => dispatch(
    'FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/:/scrobble',
      params: {
        identifier: 'com.plexapp.plugins.library',
        key: ratingKey,
      },
      signal,
    },
  ),

  UPDATE_STREAM: ({ dispatch }, {
    machineIdentifier, id, offset, signal,
  }) => dispatch('QUERY_PLEX_SERVER', {
    machineIdentifier,
    method: 'PUT',
    path: `/library/streams/${id}`,
    params: {
      offset,
    },
    signal,
  }),
};
