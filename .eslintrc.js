// Inspired by https://stackoverflow.com/a/60187886
module.exports = {
  root: true,
  env: {
    browser: true,
  },
  extends: ['plugin:vue/recommended', '@vue/airbnb'],
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2020,
  },
  rules: {
    'max-len': [
      'error',
      {
        code: 100,
        // ignoreComments: true,
        // ignoreUrls: true,
        // ignoreStrings: true,
        // ignoreTemplateLiterals: true,
      },
    ],

    'no-console': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'vuejs-accessibility/alt-text': 'off',
    'vuejs-accessibility/mouse-events-have-key-events': 'off',
    'vuejs-accessibility/label-has-for': 'off',
    'vuejs-accessibility/media-has-caption': 'off',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vue/no-v-text-v-html-on-component': 'off',
  },
};
