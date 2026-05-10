import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import cypressPlugin from 'eslint-plugin-cypress'

export default [
  { ignores: ['dist', 'cypress/**', 'cypress.config.js', '**/pdf.worker.min.js'] }, // Ignore minified files and cypress
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals
        // Add Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        test: 'readonly',
        vi: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  js.configs.recommended,
  {
    files: ['cypress/**/*.{js,jsx,ts,tsx}'],
    ...cypressPlugin.configs.recommended,
    languageOptions: {
      globals: {
        ...cypressPlugin.configs.recommended.globals,
        cy: 'readonly',
        Cypress: 'readonly',
      },
    },
  },
]
