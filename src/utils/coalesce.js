const coalesce = (...arr) => arr.find((element) => element !== null && element !== undefined);

export default coalesce;
