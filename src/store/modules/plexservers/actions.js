import { randomInt } from '@/utils/lightlodash';
import { fetchJson, queryFetch } from '@/utils/fetchutils';
import weightedRandomChoice from '@/utils/weightedrandomchoice';
import scoreMedia from './mediascoring';

const playQueueParams = {
  own: 1,
  includeChapters: 1,
  includeMarkers: 1,
  includeGeolocation: 1,
  includeExternalMedia: 1,
};

const searchHubs = ['movie', 'show', 'episode'];

export default {
  FETCH_RANDOM_SECTION_ID: async ({ getters }, machineIdentifier) => {
    const sectionId = weightedRandomChoice(getters.GET_SERVER_LIBRARY_SIZES(machineIdentifier));
    if (!sectionId) {
      throw new Error('No valid libraries found');
    }

    return sectionId;
  },

  FETCH_RANDOM_SERVER: async ({ getters }) => {
    // Weight choice by the number of items in each server
    const machineIdentifier = weightedRandomChoice(getters.GET_CONNECTABLE_SERVER_SIZES);
    if (!machineIdentifier) {
      throw new Error('No valid servers found');
    }

    return machineIdentifier;
  },

  FETCH_RANDOM_LIBRARY_ITEM: async (
    { getters, dispatch },
    { machineIdentifier, sectionId, signal },
  ) => {
    const randomItemIndex = randomInt(
      getters.GET_SERVER_LIBRARY_SIZE({ machineIdentifier, sectionId }) - 1,
    );

    const [item] = await dispatch('FETCH_LIBRARY_CONTENTS', {
      machineIdentifier,
      sectionId,
      start: randomItemIndex,
      size: 1,
      signal,
    });

    return item;
  },

  FETCH_RANDOM_ITEM: async ({ dispatch }, { machineIdentifier, sectionId, signal } = {}) => {
    const chosenServerId = machineIdentifier || (await dispatch('FETCH_RANDOM_SERVER'));

    const chosenSectionId = sectionId || (await dispatch(
      'FETCH_RANDOM_SECTION_ID',
      chosenServerId,
    ));

    const item = await dispatch('FETCH_RANDOM_LIBRARY_ITEM', {
      machineIdentifier: chosenServerId,
      sectionId: chosenSectionId,
      signal,
    });

    return {
      ...item,
      machineIdentifier: chosenServerId,
    };
  },

  FETCH_PLEX_SERVER: (
    { getters, rootGetters },
    {
      machineIdentifier, path, params, manualConnection, ...rest
    },
  ) => {
    const {
      accessToken,
      chosenConnection: { uri },
    } = manualConnection || getters.GET_PLEX_SERVER(machineIdentifier);

    return fetchJson(
      `${uri}${path}`,
      {
        ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](accessToken),
        ...params,
      },
      rest,
    );
  },

  QUERY_PLEX_SERVER: ({ getters, rootGetters }, {
    machineIdentifier, path, params, ...rest
  }) => {
    const {
      accessToken,
      chosenConnection: { uri },
    } = getters.GET_PLEX_SERVER(machineIdentifier);
    return queryFetch(
      `${uri}${path}`,
      {
        ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](accessToken),
        ...params,
      },
      rest,
    );
  },

  SEARCH_PLEX_SERVER: async ({ dispatch }, { query, machineIdentifier, signal }) => {
    const {
      MediaContainer: { Metadata },
    } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/search',
      params: {
        query,
      },
      signal,
    });

    if (!Metadata) {
      return [];
    }

    return Metadata.map((result) => ({
      ...result,
      machineIdentifier,
    }));
  },

  FETCH_PLEX_METADATA: async ({ dispatch }, { ratingKey, machineIdentifier, signal }) => {
    const {
      MediaContainer: {
        Metadata: [item],
      },
    } = await dispatch('FETCH_PLEX_SERVER', {
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
      ...item,
      machineIdentifier,
    };
  },

  SEARCH_UNBLOCKED_PLEX_SERVERS: ({ getters, dispatch }, query) => Promise.allSettled(
    getters.GET_UNBLOCKED_PLEX_SERVER_IDS.map((machineIdentifier) => dispatch(
      'SEARCH_PLEX_SERVER',
      {
        machineIdentifier,
        query,
      },
    )),
  ).then((results) => results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value)),

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
      } catch (e) {
        console.warn('Error fetching metadata for same media as host', e);
      }
    }

    const results = await dispatch('SEARCH_UNBLOCKED_PLEX_SERVERS', hostTimeline.title);
    if (results.length <= 0) {
      return null;
    }

    const bestResult = results
      .map((result) => ({
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
    const {
      MediaContainer: { Metadata },
    } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/onDeck',
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
      },
      signal,
    });

    return (
      Metadata?.map((item) => ({
        machineIdentifier,
        ...item,
      })) || []
    );
  },

  FETCH_ALL_LIBRARIES: async ({ dispatch }, { machineIdentifier, signal, ...rest }) => {
    const {
      MediaContainer: { Directory },
    } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/sections',
      signal,
      ...rest,
    });

    return Object.fromEntries(
      await Promise.all(
        Directory.map(async (library) => [
          library.key,
          {
            ...library,
            size: await dispatch('FETCH_LIBRARY_SIZE', {
              machineIdentifier,
              sectionId: library.key,
              signal,
              ...rest,
            }),
          },
        ]),
      ),
    );
  },

  FETCH_RECENTLY_ADDED_MEDIA: async ({ dispatch }, { machineIdentifier, signal }) => {
    const {
      MediaContainer: { Metadata },
    } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/library/recentlyAdded',
      signal,
    });

    return (
      Metadata?.map((item) => ({
        machineIdentifier,
        ...item,
      })) || []
    );
  },

  FETCH_CHILDREN_CONTAINER: async (
    { dispatch },
    {
      machineIdentifier, ratingKey, start, size, excludeAllLeaves, signal,
    },
  ) => {
    const { MediaContainer } = await dispatch('FETCH_PLEX_SERVER', {
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
      ...MediaContainer,
      Metadata:
        MediaContainer.Metadata?.map((child) => ({
          librarySectionID: MediaContainer.librarySectionID,
          machineIdentifier,
          ...child,
        })) || [],
    };
  },

  FETCH_MEDIA_CHILDREN: async ({ dispatch }, params) => {
    const { Metadata } = await dispatch('FETCH_CHILDREN_CONTAINER', params);
    return Metadata;
  },

  FETCH_RELATED: async ({ dispatch }, {
    machineIdentifier, ratingKey, count, signal,
  }) => {
    try {
      const {
        MediaContainer: { Hub, librarySectionID },
      } = await dispatch('FETCH_PLEX_SERVER', {
        machineIdentifier,
        path: `/library/metadata/${ratingKey}/related`,
        params: {
          excludeFields: 'summary',
          count,
        },
        signal,
      });

      // TODO: potentially include the other hubs too (related director etc...)
      return (
        Hub?.[0]?.Metadata?.map((child) => ({
          librarySectionID,
          machineIdentifier,
          ...child,
        })) || []
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  FETCH_LIBRARY_ALL: async (
    { dispatch },
    {
      machineIdentifier, sectionId, start, size, sort, signal, ...rest
    },
  ) => {
    const { MediaContainer } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/library/sections/${sectionId}/all`,
      params: {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        ...(sort && { sort }),
        includeCollections: 0,
        includeAdvanced: 1,
        includeMeta: 1,
      },
      signal,
      ...rest,
    });

    return MediaContainer;
  },

  FETCH_LIBRARY_CONTENTS: async ({ dispatch }, params) => {
    const { librarySectionID, Metadata } = await dispatch('FETCH_LIBRARY_ALL', params);

    return Metadata.map((child) => ({
      librarySectionID,
      machineIdentifier: params.machineIdentifier,
      ...child,
    }));
  },

  FETCH_LIBRARY_SIZE: async ({ dispatch }, {
    machineIdentifier, sectionId, signal, ...rest
  }) => {
    const { totalSize } = await dispatch('FETCH_LIBRARY_ALL', {
      machineIdentifier,
      sectionId,
      start: 0,
      size: 0,
      signal,
      ...rest,
    });

    return totalSize;
  },

  CREATE_PLAY_QUEUE: async ({ dispatch }, { machineIdentifier: id, ratingKey, signal }) => {
    const { MediaContainer } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier: id,
      method: 'POST',
      path: '/playQueues',
      params: {
        type: 'video',
        continuous: 1,
        uri: `server://${id}/com.plexapp.plugins.library/library/metadata/${ratingKey}`,
        repeat: 0,
        ...playQueueParams,
      },
      signal,
    });

    return MediaContainer;
  },

  FETCH_PLAY_QUEUE: async ({ dispatch }, { machineIdentifier, playQueueID, signal }) => {
    const { MediaContainer } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: `/playQueues/${playQueueID}`,
      params: playQueueParams,
      signal,
    });

    return MediaContainer;
  },

  MARK_WATCHED: ({ dispatch }, {
    machineIdentifier,
    ratingKey,
    signal,
  }) => dispatch('FETCH_PLEX_SERVER', {
    machineIdentifier,
    path: '/:/scrobble',
    params: {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey,
    },
    signal,
  }),

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

  SET_MEDIA_AS_BACKGROUND: async ({ getters, commit }, media) => {
    const url = getters.GET_MEDIA_BACKGROUND_URL(media);
    commit('SET_BACKGROUND', url, { root: true });
  },

  FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE: async ({ dispatch }, params) => {
    await dispatch('plex/FETCH_PLEX_DEVICES_IF_NEEDED', null, { root: true });
    const item = await dispatch('FETCH_RANDOM_ITEM', params);
    return dispatch('SET_MEDIA_AS_BACKGROUND', item);
  },

  SEARCH_PLEX_SERVER_HUB: async ({ dispatch }, {
    query, machineIdentifier, signal, ...extra
  }) => {
    const {
      MediaContainer: { Hub },
    } = await dispatch('FETCH_PLEX_SERVER', {
      machineIdentifier,
      path: '/hubs/search',
      params: {
        ...extra,
        query,
        includeCollections: 0,
      },
      signal,
    });

    return Hub.filter(({ Metadata, type }) => Metadata && searchHubs.includes(type)).map(
      ({ Metadata, ...rest }) => ({
        ...rest,
        Metadata: Metadata.map((item) => ({
          ...item,
          machineIdentifier,
        })),
      }),
    );
  },
};
