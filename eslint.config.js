// Flat ESLint config for the IELTS app
import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        indexedDB: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        performance: 'readonly'
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off'
    }
  },
  {
    files: ['src/test/**/*.{js,jsx}', 'src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  },
  {
    files: ['vite.config.js', 'vitest.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly'
      }
    }
  }
]
