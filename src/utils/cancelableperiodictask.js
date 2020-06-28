import delay from '@/utils/delay';

// This is used in a similar way as intervals except if the periodic task is async and may take longer
// than the interval, so each interval, we wait for whatever is longer
const makeCancelablePeriodicTask = (periodicTaskFunc, intervalTimeFunc) => {
  let isCancelled = false;
  const cancelTask = () => {
    isCancelled = true;
  };

  const periodicTaskExecutor = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (isCancelled) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await Promise.all([
        delay(intervalTimeFunc()),
        periodicTaskFunc(),
      ]);
    }
  };

  // Purposefully don't await this
  periodicTaskExecutor();

  return cancelTask;
};

export default makeCancelablePeriodicTask;
