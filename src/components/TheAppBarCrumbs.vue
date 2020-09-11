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
import getContentLink from '@/utils/contentlinks';

export default {
  name: 'TheAppBarCrumbs',

  computed: {
    ...mapGetters([
      'GET_ACTIVE_METADATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    crumbs() {
      if (this.$route.path.indexOf('browse') === -1 && this.$route.name !== 'NowPlaying') {
        return [];
      }

      const data = [
        {
          text: 'Home',
          to: { name: 'PlexHome' },
        },
      ];

      if (this.GET_ACTIVE_METADATA) {
        data.push({
          text: this.GET_PLEX_SERVER(this.GET_ACTIVE_METADATA.machineIdentifier).name,
          to: {
            name: 'PlexServer',
            params: {
              machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
            },
          },
        });

        if (this.GET_ACTIVE_METADATA.librarySectionID != null) {
          data.push({
            text: this.GET_ACTIVE_METADATA.librarySectionTitle,
            to: {
              name: 'PlexLibrary',
              params: {
                machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                sectionId: this.GET_ACTIVE_METADATA.librarySectionID,
              },
            },
          });
        }

        if (this.GET_ACTIVE_METADATA.grandparentRatingKey != null) {
          // TODO: figure out how to tell lol
          data.push({
            text: this.GET_ACTIVE_METADATA.grandparentTitle,
            to: {
              name: 'PlexSeries',
              params: {
                machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                sectionId: this.GET_ACTIVE_METADATA.librarySectionID,
                ratingKey: this.GET_ACTIVE_METADATA.grandparentRatingKey,
              },
            },
          });
        }

        if (this.GET_ACTIVE_METADATA.parentRatingKey != null) {
          switch (this.GET_ACTIVE_METADATA.type) {
            case 'episode': {
              data.push({
                text: this.GET_ACTIVE_METADATA.parentTitle,
                to: {
                  name: 'PlexSeason',
                  params: {
                    machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                    sectionId: this.GET_ACTIVE_METADATA.librarySectionID,
                    parentRatingKey: this.GET_ACTIVE_METADATA.grandparentRatingKey,
                    ratingKey: this.GET_ACTIVE_METADATA.parentRatingKey,
                  },
                },
              });

              break;
            }

            default: {
              data.push({
                text: this.GET_ACTIVE_METADATA.parentTitle,
                to: {
                  name: 'PlexSeries',
                  params: {
                    machineIdentifier: this.GET_ACTIVE_METADATA.machineIdentifier,
                    sectionId: this.GET_ACTIVE_METADATA.librarySectionID,
                    ratingKey: this.GET_ACTIVE_METADATA.parentRatingKey,
                  },
                },
              });

              break;
            }
          }
        }

        if (this.GET_ACTIVE_METADATA.ratingKey != null) {
          data.push({
            text: this.GET_ACTIVE_METADATA.title,
            to: getContentLink(this.GET_ACTIVE_METADATA),
          });
        }
      }

      return data;
    },
  },
};
</script>
