// There doesn't seem to be a valid Promise.any polyfill in the current build config so I found one myself

export default {
  any: (promises) => Promise.all(promises.map((promise) => promise.then((val) => {
    throw val;
  }, (reason) => reason))).then((reasons) => {
    throw reasons;
  }, (firstResolved) => firstResolved),
};
