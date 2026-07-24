const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');

// CommonJS on purpose - there's no "type":"module" in package.json, so ESLint
// loads this file as CJS even though the app code is ESM.
module.exports = [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    // build/tooling config files run in node (some CJS, some ESM)
    files: ['*.config.js', 'eslint.config.js', 'postcss.config.js', 'tailwind.config.js', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {
      // JSX "uses" React and components without eslint-plugin-react seeing it
      'no-unused-vars': ['warn', { varsIgnorePattern: '^React$|^[A-Z]', argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
