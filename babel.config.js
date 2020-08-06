module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
  ],

  // https://github.com/webpack/webpack/issues/10227
  // TODO: remove these plugins when we get webpack 5
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
};
