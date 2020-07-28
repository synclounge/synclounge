// I really shouldn't be using this but I am
const Deferred = () => {
  /* A method to resolve the associated Promise with the value passed.
     * If the promise is already settled it does nothing.
     *
     * @param {anything} value : This value is used to resolve the promise
     * If the value is a Promise then the associated promise assumes the state
     * of Promise passed as value.
     */
  let resolve = null;

  /* A method to reject the assocaited Promise with the value passed.
     * If the promise is already settled it does nothing.
     *
     * @param {anything} reason: The reason for the rejection of the Promise.
     * Generally its an Error object. If however a Promise is passed, then the Promise
     * itself will be the reason for rejection no matter the state of the Promise.
     */
  let reject = null;

  /* A newly created Promise object.
     * Initially in pending state.
     */
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return Object.freeze({
    promise,
    resolve,
    reject,
  });
};

export default Deferred;
