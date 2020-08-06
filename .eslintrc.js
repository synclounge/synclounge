// Inspired by https://stackoverflow.com/a/60187886
module.exports = {
  root: true,
  env: {
    browser: true,
  },
  extends: ['plugin:vue/recommended', '@vue/airbnb'],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
  },
  rules: {
    'max-len': [
      'error',
      {
        code: 100,
        // ignoreComments: true,
        // ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],

    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
