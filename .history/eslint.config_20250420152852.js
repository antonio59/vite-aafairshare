export default [
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