<template>
  <v-row
    v-if="!metadata"
  >
    <v-col
      cols="12"
      style="position: relative;"
    >
      <v-progress-circular
        style="left: 50%; top: 50%;"
        :size="60"
        indeterminate
        class="amber--text"
      />
    </v-col>
  </v-row>

  <v-container v-else>
    <v-row>
      <v-col
        cols="12"
        style="background: rgba(0, 0, 0, 0.4);"
      >
        <v-card
          class="darken-2 white--text"
          :img="getArtUrl"
        >
          <v-container
            style="background: rgba(0, 0, 0, 0.6);"
            class="pa-3 ma-0"
            fluid
          >
            <v-row
              style="height: 100%;"
            >
              <v-col
                cols="12"
                md="3"
                class="hidden-sm-and-down"
              >
                <v-img
                  :src="thumb"
                  class="ma-0 pa-0 hidden-sm-and-down"
                  height="25em"
                  contain
                />
              </v-col>

              <v-col
                cols="12"
                md="9"
              >
                <v-container>
                  <h1> {{ metadata.title }}</h1>
                  <p> {{ getSeasons }} - {{ metadata.year }} </p>
                  <v-divider />
                  <p
                    style="font-style: italic;"
                    class="pt-3; overflow: hidden"
                  >
                    {{ metadata.summary }}
                  </p>

                  <div>
                    <v-chip
                      v-for="genre in genres"
                      :key="genre.tag"
                      label
                      color="grey"
                    >
                      {{ genre.tag }}
                    </v-chip>
                  </div>

                  <v-subheader class="white--text">
                    Featuring
                  </v-subheader>

                  <v-row
                    v-if="metadata"
                  >
                    <v-col
                      v-for="role in roles"
                      :key="role.tag"
                      cols="12"
                      md="6"
                      lg="4"
                    >
                      <v-chip style="border: none; background: none; color: white;">
                        <v-avatar>
                          <img :src="role.thumb">
                        </v-avatar>
                        {{ role.tag }}
                        <div
                          style="opacity: 0.7; font-size: 80%;"
                          class="pa-2"
                        >
                          {{ role.role }}
                        </div>
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-container>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>

    <h4 class="mt-3">
      Seasons
    </h4>

    <v-row>
      <v-col
        v-for="content in children"
        :key="content.key"
        cols="4"
        md="2"
        lg="1"
        class="pb-3"
      >
        <plexthumb
          :content="content"
          :machine-identifier="machineIdentifier"
          type="thumb"
          style="margin: 7%;"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { getAppWidth, getAppHeight } from '@/utils/sizing';

export default {
  components: {
    plexthumb: () => import('@/components/plex/plexthumb.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },

    ratingKey: {
      type: [Number, String],
      required: true,
    },
  },

  data() {
    return {
      metadata: null,
      children: [],
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
    ]),

    getArtUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.metadata.banner,
        width: getAppWidth(),
        height: getAppHeight(),
        blur: 2,
      });
    },

    getSeasons() {
      if (this.children.length === 1) {
        return `${this.children.length} season`;
      }
      return `${this.children.length} seasons`;
    },

    roles() {
      if (!this.metadata) {
        return [];
      }
      return this.metadata.Role.slice(0, 6);
    },

    genres() {
      if (!this.metadata) {
        return [];
      }
      return this.metadata.Genre.slice(0, 5);
    },

    thumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.metadata.thumb,
        width: getAppWidth(),
        height: getAppHeight(),
      });
    },
  },

  async mounted() {
    await Promise.all([
      this.fetchMetadata(),
      this.fetchChildren(),
    ]);
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_PLEX_METADATA',
      'FETCH_MEDIA_CHILDREN',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async fetchMetadata() {
      this.metadata = await this.FETCH_PLEX_METADATA({
        ratingKey: this.ratingKey,
        machineIdentifier: this.machineIdentifier,
      });

      this.SET_ACTIVE_METADATA(this.metadata);

      this.setBackground();
    },

    async fetchChildren() {
      this.children = await this.FETCH_MEDIA_CHILDREN({
        machineIdentifier: this.machineIdentifier,
        ratingKey: this.ratingKey,
        start: 0,
        size: 150,
        excludeAllLeaves: 1,
      });
    },

    setBackground() {
      this.$store.commit('SET_BACKGROUND',
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: this.metadata.art,
          width: getAppWidth() / 4,
          height: getAppHeight() / 4,
          blur: 2,
        }));
    },
  },
};
</script>
