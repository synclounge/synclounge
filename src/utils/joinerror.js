// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
class JoinError extends Error {
  constructor(passwordIncorrect, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JoinError);
    }

    this.name = 'JoinError';
    // Custom debugging information
    this.passwordIncorrect = passwordIncorrect;
  }
}

export default JoinError;
