import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';

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
    ],
  },
  {
    plugins: {
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': ['warn'],
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