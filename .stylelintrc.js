export default {
  rules: {
    'selector-class-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
  extends: ['stylelint-config-standard-scss', 'stylelint-config-clean-order'],
};
