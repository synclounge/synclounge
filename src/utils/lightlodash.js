export const difference = (arrays) => arrays.reduce((a, b) => a.filter((c) => !b.includes(c)));

export const intersection = (arrays) => arrays.reduce((a, b) => a.filter((c) => b.includes(c)));

export const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));
  return Math.floor(lower + Math.random() * (upper - lower + 1));
};
