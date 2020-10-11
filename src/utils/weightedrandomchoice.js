// Choices should be an object where each entry is [id, weight], and weight is a number
const prefixSum = (arr) => arr.reduce(
  (a, x, i) => [
    ...a,
    a.length > 0
      ? x + a[i - 1]
      : x,
  ],
  [],
);

const weightedRandomChoice = (choices) => {
  const keys = Object.keys(choices);
  const weights = Object.values(choices);

  const sum = weights.reduce((acc, el) => acc + el, 0);

  const weightsPrefixSum = prefixSum(weights);
  const rand = Math.random() * sum;

  return keys[weightsPrefixSum.findIndex((el) => el > rand)];
};

export default weightedRandomChoice;
