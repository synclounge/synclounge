export default (timeoutMs, promise) => Promise.race([
  promise(),
  new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timed out')), timeoutMs)),
]);
