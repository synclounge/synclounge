import { sample, maxBy } from 'lodash-es';
import scoreMedia from './mediascoring';

export default {
  FETCH_RANDOM_ITEM: async ({ dispatch }, machineIdentifier) => {
    const libraryKeys = await dispatch('FETCH_ALL_LIBRARIES', machineIdentifier)
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
    await dispatch('FETCH_PLEX_DEVICES_IF_NEEDED');

    const machineIdentifier = sample(getters.GET_CONNECTABLE_PLEX_SERVER_IDS);
    if (!machineIdentifier) {
      throw new Error('No valid servers found');
    }

    const result = await dispatch('GET_RANDOM_ITEM', machineIdentifier);
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

    // this.commit('SET_LIBRARYCACHE', [
    //   data.MediaContainer.librarySectionID,
    //   this.clientIdentifier,
    //   data.MediaContainer.librarySectionTitle,
    // ]);
    return data.MediaContainer.Metadata[0];
  },

  CACHE_METADATA_TITLES: ({ commit }, { machineIdentifier, result }) => {
    // This data is used in our router breadcrumbs
    if (result.Metadata
        && result.Metadata.length > 0
    ) {
      result.Metadata.forEach((item) => {
        if (item.ratingKey) {
          commit('SET_ITEMCACHE', [
            item.ratingKey,
            { title: item.title, machineIdentifier },
          ], { root: true });
        }

        if (item.parentRatingKey) {
          commit('SET_ITEMCACHE', [
            item.parentRatingKey,
            { title: item.parentTitle, machineIdentifier },
          ], { root: true });
        }

        if (item.grandparentRatingKey) {
          commit('SET_ITEMCACHE', [
            item.grandparentRatingKey,
            { title: item.grandparentTitle, machineIdentifier },
          ], { root: true });
        }
      });
    } else {
      if (result.ratingKey) {
        commit('SET_ITEMCACHE', [result.ratingKey, { title: result.title, machineIdentifier }]);
      }

      if (result.parentRatingKey) {
        commit('SET_ITEMCACHE', [
          result.parentRatingKey,
          { title: result.parentTitle, machineIdentifier },
        ], { root: true });
      }

      if (result.grandparentRatingKey) {
        commit('SET_ITEMCACHE', [
          result.grandparentRatingKey,
          {
            title: result.grandparentTitle,
            machineIdentifier,
          },
        ], { root: true });
      }
    }
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
        await dispatch('FETCH_PLEX_METADATA', {
          ratingKey: hostTimeline.ratingKey,
          machineIdentifier: hostTimeline.machineIdentifier,
        });

        return {
          ratingKey: hostTimeline.ratingKey,
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

  FETCH_ALL_LIBRARIES: async ({ getters }, machineIdentifier) => {
    const { data } = await getters.GET_PLEX_SERVER_AXIOS(machineIdentifier).get('/library/sections');
    // if (data && data.MediaContainer) {
    //   data.MediaContainer.Directory.forEach((library) => {
    //     this.commit('SET_LIBRARYCACHE', [library.key, this.clientIdentifier, library.title]);
    //   });
    // }
    return data.MediaContainer.Directory;
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

  FETCH_SHOW: async ({ getters }, {
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
};
