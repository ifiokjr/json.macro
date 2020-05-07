const tsProjectOptions = { project: ['./tsconfig.lint.json'] };

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended', // Disables incompatible eslint:recommended settings
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    ...tsProjectOptions,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
  },
  rules: {
    'sort-imports': 'off',

    // Use nice import rules
    'simple-import-sort/sort': ['warn'],

    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowTernary: true, allowShortCircuit: true },
    ],

    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
    '@typescript-eslint/restrict-plus-operands': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/camelcase': [
      'warn',
      { ignoreDestructuring: true, properties: 'never' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/member-ordering': [
      'warn',
      {
        default: [
          'signature',
          'static-field',
          'static-method',
          'field',
          'constructor',
          'method',
        ],
      },
    ],
    '@typescript-eslint/method-signature-style': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/no-unused-vars-experimental': [
      'error',
      { ignoreArgsIfArgsAfterAreUsed: true },
    ],
    '@typescript-eslint/array-type': [
      'error',
      { default: 'array-simple', readonly: 'array-simple' },
    ],

    // Built in eslint rules

    'no-empty': 'warn',
    'no-useless-escape': 'warn',
    'default-case': 'warn',
    'prefer-template': 'warn',
    'guard-for-in': 'warn',
    'prefer-object-spread': 'warn',
    curly: ['warn', 'all'],
    'no-invalid-regexp': 'error',
    'no-multi-str': 'error',
    'no-constant-condition': 'error',
    'no-extra-boolean-cast': 'error',
    radix: 'error',
    'no-return-assign': ['error', 'except-parens'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'prefer-exponentiation-operator': 'error',
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
  },
};
