module.exports = {
  root: true,
  extends: ['stylelint-config-standard'],
  customSyntax: 'postcss-sass',
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
};
