const config = {
  singleQuote: true,

  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^react(.*)$', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'jsx'],
};

module.exports = config;
