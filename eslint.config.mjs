import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'

export default [
  { ignores: [
    'dist',
    'node_modules',
    'backup',
    'functions/lib',
    'src_backup',
    'shared_backup',
    'test',
    'tests',
    '.history',
    'shared/dist',
    'scripts',
    'supabase/functions',
    '*.d.ts'
  ] },

  // Base config for all files
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    settings: {
      react: { version: 'detect' },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        typescript: true,
        node: true
      }
    }
  },

  // JavaScript files in src and config files
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        process: true,
        React: true,
        Buffer: true,
        __dirname: true,
        require: true
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      'react': reactRecommended.plugins.react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactRecommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
      'import/no-commonjs': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
      'no-case-declarations': 'off'
    }
  },

  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: '.',
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        vitest: true,
        process: true,
        React: true,
        Buffer: true,
        __dirname: true,
        require: true
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react': reactRecommended.plugins.react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...reactRecommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-refresh/only-export-components': 'off',
      'no-duplicate-imports': 'off',
      'import/no-duplicates': 'off',
      'import/export': 'off',
      'import/no-relative-parent-imports': 'off',
      'import/no-unresolved': 'off',
      'import/no-commonjs': 'off',
      'no-case-declarations': 'off',
      'jsx-a11y/heading-has-content': 'off',
      'no-redeclare': 'off'
    }
  },

  // Config files
  {
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'tailwind.config.js',
      'postcss.config.js'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null
      },
      globals: {
        ...globals.node,
        process: true,
        __dirname: true,
        require: true
      }
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
      'import/no-commonjs': 'off',
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/no-duplicates': 'off'
    }
  }
]
