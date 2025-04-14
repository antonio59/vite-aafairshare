module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    commonjs: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'import',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // Prevent duplicate imports
    'no-duplicate-imports': 'error',
    'import/no-duplicates': 'error',
    
    // Enforce file extensions for React components
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.tsx'] }
    ],
    
    // Prevent named exports that conflict with default exports from other files
    'import/export': 'error',
    
    // Enforce PascalCase for component names
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'function',
        format: ['PascalCase'],
        filter: {
          regex: '^[A-Z][a-zA-Z0-9]+$',
          match: true
        },
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid'
      }
    ],
    
    // Enforce consistent import paths
    'import/no-relative-parent-imports': 'error',
    
    // Prefer type imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' }
    ],
    
    // Enforce proper prop types in TypeScript
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Path aliasing - enforce @/ imports instead of relative paths
    'import/no-unresolved': 'error',
    
    // Additional rules
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    
    // Custom rule to prevent importing both JSX and TSX versions
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['*/*.jsx', '*/*.tsx'],
          message: 'Do not mix JSX and TSX imports. Only use TSX imports.'
        },
        {
          group: ['**/components/*/*.jsx', '**/components/*/*.tsx'],
          message: 'Do not import both JSX and TSX versions of the same component. Use only TSX versions.'
        },
        {
          group: ['**/components/*/*'],
          message: 'Check if you are importing both JSX and TSX versions of the same component. Use only TSX versions.',
          importNames: ['default'],
        }
      ]
    }],
    
    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Allow __dirname in Node.js environment
    'no-undef': ['error', { typeof: true }]
  },
  overrides: [
    {
      // Override rules for JSX files while migrating
      files: ['*.jsx'],
      rules: {
        'react/jsx-filename-extension': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/naming-convention': 'off',
        'react/prop-types': 'warn',
        'import/extensions': [
          'warn',
          'ignorePackages',
          {
            js: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
          },
        ],
      }
    },
    {
      // TypeScript-specific rules
      files: ['*.ts', '*.tsx'],
      rules: {
        'react/prop-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      // Node.js script files
      files: ['scripts/*.js', 'vite.config.js', '.eslintrc.js', 'functions/**/*.js'],
      env: {
        node: true,
        commonjs: true
      },
      rules: {
        'no-undef': 'off' // Allow global Node.js variables
      }
    }
  ]
}; 