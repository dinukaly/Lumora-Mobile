const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  globalIgnores(['.expo/*', 'dist/*']),
]);
