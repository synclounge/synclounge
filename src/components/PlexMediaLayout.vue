<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card
          :img="artUrl"
        >
          <v-container
            style="background: rgb(0 0 0 / 70%);"
            fluid
          >
            <v-row no-gutters>
              <v-col
                cols="12"
                md="auto"
                order="last"
                order-md="first"
                class="mr-3"
              >
                <v-container fluid>
                  <v-row>
                    <v-col cols="12">
                      <v-img
                        :src="thumbUrl"
                        width="200"
                        :aspect-ratio="2 / 3"
                        class="hidden-sm-and-down"
                      />
                    </v-col>
                  </v-row>

                  <slot name="belowImage" />
                </v-container>
              </v-col>

              <v-col
                cols="12"
                md=""
              >
                <v-container>
                  <v-row dense>
                    <v-col
                      class="text-h4"
                    >
                      {{ title }}
                    </v-col>

                    <slot name="postTitle" />

                    <v-col
                      cols="12"
                      class="text-subtitle-1"
                    >
                      {{ secondaryTitle }}
                    </v-col>

                    <v-col
                      v-if="subtitle"
                      cols="12"
                      class="text-subtitle-2"
                    >
                      {{ subtitle }}
                    </v-col>

                    <v-col
                      v-if="secondarySubtitle"
                      cols="12"
                      class="text-caption text--secondary"
                    >
                      {{ secondarySubtitle }}
                    </v-col>
                  </v-row>

                  <v-divider />

                  <slot name="content" />
                </v-container>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>

    <template v-if="children.length">
      <v-subheader>{{ childrenHeader }}</v-subheader>

      <v-row>
        <v-col
          v-for="child in children"
          :key="child.key"
          :cols="childCols"
          :sm="childSm"
          :md="childMd"
          :lg="childLg"
          :xl="childXl"
        >
          <PlexThumbnail
            :content="child"
            type="thumb"
            :full-title="childFullTitle"
            :cols="childCols"
            :sm="childSm"
            :md="childMd"
            :lg="childLg"
            :xl="childXl"
          />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';
import { getAppWidth, getAppHeight } from '@/utils/sizing';

const breakpoints = ['childSm', 'childMd', 'childLg', 'childXl'];
const breakpointProps = (() => breakpoints.reduce((props, val) => ({
  ...props,
  [val]: {
    type: [Boolean, String, Number],
    default: false,
  },
}), {}))();

export default {
  name: 'PlexSeries',

  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },

    art: {
      type: String,
      required: true,
    },

    thumb: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    secondaryTitle: {
      type: String,
      required: true,
    },

    subtitle: {
      type: String,
      default: '',
    },

    secondarySubtitle: {
      type: String,
      default: '',
    },

    childrenHeader: {
      type: String,
      required: true,
    },

    children: {
      type: Array,
      required: true,
    },

    childCols: {
      type: [String, Number],
      default: 12,
    },

    childFullTitle: {
      type: Boolean,
      default: false,
    },

    ...breakpointProps,
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
    ]),

    artUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.art,
        width: getAppWidth(),
        height: getAppHeight(),
        blur: 2,
      });
    },

    thumbUrl() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: this.thumb,
        width: getAppWidth(),
        height: getAppHeight(),
      });
    },
  },
};
</script>
