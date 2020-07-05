const makeCancelablePeriodicTask = (periodicTaskFunc, intervalTimeFunc) => {
  let timerId = null;
  const cancel = () => {
    clearTimeout(timerId);
  };

  const poll = async () => {
    // TODO: potential deep cancellation of the task?
    await periodicTaskFunc();
    timerId = setTimeout(poll, intervalTimeFunc());
  };

  poll();

  return cancel;
};

export default makeCancelablePeriodicTask;
