const makeCancelablePeriodicTask = (periodicTaskFunc, intervalTimeFunc) => {
  let timerId = null;
  const cancel = () => {
    // TODO: this fails if cancel is called while awaiting the periodicTaskFunc
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
