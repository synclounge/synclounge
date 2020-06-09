module.exports = {
  coalesce: (...arr) => arr.find((element) => element !== null && element !== undefined) || null,
};
