import { intervalToDuration, formatDuration } from 'date-fns';

// https://github.com/date-fns/date-fns/issues/229

const customFormatDuration = ({ start, end }) => {
  const durations = intervalToDuration({ start, end });
  return formatDuration(durations);
};

export default customFormatDuration;
