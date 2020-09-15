<template>
  <v-breadcrumbs
    :items="crumbs"
    class="text-xs-left"
    style="justify-content: left;"
  >
    <template #divider>
      <v-icon>chevron_right</v-icon>
    </template>

    <template #item="props">
      <v-breadcrumbs-item
        :to="props.item.to"
        :exact="true"
      >
        {{ props.item.text }}
      </v-breadcrumbs-item>
    </template>
  </v-breadcrumbs>
</template>

<script>
import { mapGetters } from 'vuex';
import linkWithRoom from '@/mixins/linkwithroom';
import contentLink from '@/mixins/contentlink';

export default {
  name: 'TheAppBarCrumbs',

  mixins: [
    contentLink,
    linkWithRoom,
  ],

  computed: {
    ...mapGetters([
      'GET_ACTIVE_METADATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    crumbs() {
      const data = [
        {
          text: 'Home',
          to: this.linkWithRoom({ name: 'PlexHome' }),
        },
      ];

      if (this.GET_ACTIVE_METADATA) {
        if (this.GET_ACTIVE_METADATA.query) {
          data.push({
            text: `Search: ${this.GET_ACTIVE_METADATA.query}`,
            to: this.linkWithRoom({
              name: 'PlexSearch',
              params: {
                query: this.GET_ACTIVE_METADATA.query,
              },
            }),
          });
        }

        if (this.GET_ACTIVE_METADATA.machineIdentifier) {
          data.push({
            text: this.GET_PLEX_SERVER(this.GET_ACTIVE_METADATA.machineIdentifier).name,
            to: this.linkWithRoom({
              name: 'PlexServer',
              params: {
                machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
              },
            }),
          });

          if (this.GET_ACTIVE_METADATA.librarySectionID != null) {
            data.push({
              text: this.GET_ACTIVE_METADATA.librarySectionTitle,
              to: this.linkWithRoom({
                name: 'PlexLibrary',
                params: {
                  machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                  sectionId: this.GET_ACTIVE_METADATA.librarySectionID,
                },
              }),
            });
          }

          if (this.GET_ACTIVE_METADATA.grandparentRatingKey != null) {
          // TODO: figure out how to tell lol
            data.push({
              text: this.GET_ACTIVE_METADATA.grandparentTitle,
              to: this.linkWithRoom({
                name: 'PlexMedia',
                params: {
                  machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                  ratingKey: this.GET_ACTIVE_METADATA.grandparentRatingKey,
                },
              }),
            });
          }

          if (this.GET_ACTIVE_METADATA.parentRatingKey != null) {
            data.push({
              text: this.GET_ACTIVE_METADATA.parentTitle,
              to: this.linkWithRoom({
                name: 'PlexMedia',
                params: {
                  machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                  ratingKey: this.GET_ACTIVE_METADATA.parentRatingKey,
                },
              }),
            });
          }

          if (this.GET_ACTIVE_METADATA.ratingKey != null) {
            data.push({
              text: this.GET_ACTIVE_METADATA.title,
              to: this.contentLink(this.GET_ACTIVE_METADATA),
            });
          }
        }
      }

      return data;
    },
  },
};
</script>
