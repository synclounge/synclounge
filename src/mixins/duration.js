import customFormatDuration from '@/utils/customformatduration';

export default {
  methods: {
    getDuration(end) {
      return customFormatDuration({ start: 0, end });
    },
  },
};
