
/* eslint-disable no-undef */
/* eslint-env node */

module.exports = {
  ignores: [
    'node_modules/',
    'dist/',
    'build/',
    'lib/',
    'functions/lib/',
    'coverage/'
  ],
  root: true,
  env: {
    es6: true,
    node: true,
    commonjs: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
    tsconfigRootDir: __dirname
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'no-restricted-globals': ['error', 'name', 'length'],
    'prefer-arrow-callback': 'error',
    'import/no-unresolved': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off'
      }
    }
  ]
}