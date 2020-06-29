import { sample, maxBy } from 'lodash-es';
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

  SEARCH_PLEX_SERVER: async ({ getters }, { query, machineIdentifier }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/search',
      {
        params: {
          query,
        },
      });

    if (!data.MediaContainer.Metadata) {
      return [];
    }

    return data.MediaContainer.Metadata.map((result) => ({
      ...result,
      machineIdentifier,
    }));
  },

  FETCH_PLEX_METADATA: async ({ getters }, { ratingKey, machineIdentifier }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/library/metadata/${ratingKey}`);

    return {
      ...data.MediaContainer.Metadata[0],
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
          machineIdentifier: hostTimeline.machineIdentifier,
          mediaIndex: hostTimeline.mediaIndex,
          offset: hostTimeline.time,
        };
        // eslint-disable-next-line no-empty
      } catch { }
    }

    const results = await dispatch('SEARCH_UNBLOCKED_PLEX_SERVERS', hostTimeline.rawTitle);

    const bestResult = maxBy(results, (result) => scoreMedia(result, hostTimeline));

    console.log(bestResult);
    return bestResult;
  },

  FETCH_ON_DECK: async ({ getters }, { machineIdentifier, start, size }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/library/onDeck',
      {
        params: {
          'X-Plex-Container-Start': start,
          'X-Plex-Container-Size': size,
        },
      });

    return data.MediaContainer.Metadata;
  },

  FETCH_ALL_LIBRARIES: async ({ getters, commit }, machineIdentifier) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/library/sections');

    commit('SET_PLEX_SERVER_LIBRARIES', {
      machineIdentifier,
      libraries: data.MediaContainer.Directory,
    });
  },

  FETCH_ALL_LIBRARIES_IF_NEEDED: async ({ getters, dispatch }, machineIdentifier) => {
    if (!getters.GET_PLEX_SERVER(machineIdentifier).libraries) {
      await dispatch('FETCH_ALL_LIBRARIES', machineIdentifier);
    }
  },

  FETCH_RECENTLY_ADDED_MEDIA: async ({ getters }, machineIdentifier) => {
    const { data } = await getters
      .GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/library/recentlyAdded');

    return data.MediaContainer.Metadata;
  },

  FETCH_MEDIA_CHILDREN: async ({ getters }, {
    machineIdentifier, ratingKey, start, size, excludeAllLeaves,
  }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/library/metadata/${ratingKey}/children`, {
        params: {
          'X-Plex-Container-Start': start,
          'X-Plex-Container-Size': size,
          excludeAllLeaves,
        },
      });

    return data.MediaContainer.Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  FETCH_SEASON: async ({ getters }, {
    machineIdentifier, ratingKey, start, size, excludeAllLeaves,
  }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/library/metadata/${ratingKey}/children`, {
        params: {
          'X-Plex-Container-Start': start,
          'X-Plex-Container-Size': size,
          excludeAllLeaves,
        },
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

  FETCH_RELATED: async ({ getters }, { machineIdentifier, ratingKey, count }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/library/metadata/${ratingKey}/related`, {
        excludeFields: 'summary',
        count,
      });

    // TODO: potentially include the other hubs too (related director etc...)
    return data.MediaContainer.Hub[0].Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  FETCH_LIBRARY_CONTENTS: async ({ getters }, {
    machineIdentifier, sectionId, start, size,
  }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/library/sections/${sectionId}/all`, {
        params: {
          'X-Plex-Container-Start': start,
          'X-Plex-Container-Size': size,
          excludeAllLeaves: 1,
        },
      });

    return data.MediaContainer.Metadata.map((child) => ({
      ...child,
      librarySectionID: data.MediaContainer.librarySectionID,
    }));
  },

  FETCH_POST_PLAY: async ({ getters }, { machineIdentifier, ratingKey }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier)
      .get(`/hubs/metadata/${ratingKey}/postplay`);

    return {
      ...data.MediaContainer.Hub[0].Metadata[0],
      machineIdentifier,
    };
  },

  CREATE_PLAY_QUEUE: async ({ getters }, { machineIdentifier, ratingKey }) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier).post('/playQueues', null, {
      params: {
        type: 'video',
        continuous: 1,
        uri: `server://${machineIdentifier}/com.plexapp.plugins.library/library/metadata/${ratingKey}`,
        own: 1,
        includeExternalMedia: 1,
      },
    });

    return data.MediaContainer;
  },

  MARK_WATCHED: ({ getters }, { machineIdentifier, ratingKey }) => getters
    .GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/:/scrobble', {
      params: {
        identifier: 'com.plexapp.plugins.library',
        key: ratingKey,
      },
    }),
};
