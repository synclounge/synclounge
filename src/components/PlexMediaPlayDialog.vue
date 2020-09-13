<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <template #activator="stuff">
      <slot
        v-bind="stuff"
      />
    </template>

    <v-card>
      <v-card-title class="headline">
        Playback Settings
      </v-card-title>

      <v-card-subtitle>
        <v-checkbox
          v-if="metadata.viewOffset"
          v-model="resumeFrom"
          hide-details
          :label="'Resume from ' + getDuration(metadata.viewOffset)"
        />
      </v-card-subtitle>

      <v-card-actions>
        <v-list>
          <v-list-item
            v-for="(media, index) in metadata.Media"
            :key="media.Part[0].key"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ media.videoResolution }}p -
                <span class="text--secondary">{{ getDuration(media.duration) }}</span>
              </v-list-item-title>

              <v-list-item-subtitle>
                Video Codec: {{ media.videoCodec }} ({{ media.bitrate }}kbps)
              </v-list-item-subtitle>

              <v-list-item-subtitle>
                Audio Streams: {{ audioStreams(media.Part[0].Stream) }}
              </v-list-item-subtitle>

              <v-list-item-subtitle>
                Subtitles: {{ subtitleStreams(media.Part[0].Stream) }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-btn
                class="primary"
                @click="playClicked(index)"
              >
                Play
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import duration from '@/mixins/duration';
import playMedia from '@/mixins/playmedia';

export default {
  name: 'PlexMediaPlayDialog',

  mixins: [
    duration,
    playMedia,
  ],

  props: {
    metadata: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    dialog: false,
    resumeFrom: true,
  }),

  computed: {
    offset() {
      return this.resumeFrom
        ? this.metadata.viewOffset
        : 0;
    },
  },

  methods: {
    getStreamCount(streams, type) {
      let count = 0;
      streams.forEach((stream) => {
        if (stream.streamType === type) {
          count += 1;
        }
      });
      return count;
    },

    formatStreams(streams) {
      return streams.map(({ extendedDisplayTitle }) => extendedDisplayTitle)
        .join(', ');
    },

    audioStreams(media) {
      console.log(media);
      return this.formatStreams(media.filter(({ streamType }) => streamType === 2));
    },

    subtitleStreams(media) {
      return this.formatStreams(media.filter(({ streamType }) => streamType === 3));
    },

    async playClicked(mediaIndex) {
      this.dialog = false;
      await this.playMedia(this.metadata, mediaIndex, this.offset);
    },
  },
};
</script>
