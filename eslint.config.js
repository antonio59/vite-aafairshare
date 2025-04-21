import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import eslintPluginReact from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '.history/',
      'scripts/',
      'dist/',
      'build/',
      'node_modules/',
      'lib/',
      'functions/lib/',
      'coverage/',
      'shared/dist/',
      'shared/schema.js',
    ],
  },
  {
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      'react': eslintPluginReact,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': ['warn'],
      'react/no-unknown-property': 'error',
    },
  },
  {
    files: [
      '*.test.ts',
      '*.test.tsx',
      '*.spec.ts',
      '*.spec.tsx',
      'test/**',
      'scripts/**',
      'src/test/**',
      'src/lib/**',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]; 