// mazearning/eslint.config.js

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // 🌐 Ignore directories globally
  globalIgnores([
    'node_modules',
    'dist',
    'coverage',
    '*.config.js',
  ]),

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      reactHooks,
      reactRefresh,
    },
    settings: {
      react: {
        version: 'detect', // React version auto-detect
      },
    },
    // 🧩 Extend base + plugin configs
    extends: [
      js.configs.recommended,
      'plugin:react/recommended',
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite, // Vite + Fast Refresh support
    ],
    rules: {
      // ✅ Allow unnecessarily capitalized vars (like Component names)
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // 🧼 Optional: Remove PropTypes if using TS exclusively
      'react/prop-types': 'off',
    },
  },
]);
