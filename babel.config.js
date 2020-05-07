const ignore = [
  '**/__tests__',
  '**/__dts__',
  '**/__mocks__',
  '**/__fixtures__',
  '*.{test,spec}.{ts,tsx}',
  '**/*.d.ts',
  '*.d.ts',
];

module.exports = {
  presets: ['@babel/preset-typescript', '@babel/preset-env'],
  plugins: [
    'annotate-pure-calls',
    'dev-expression',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
  ],
  env: { production: { ignore }, development: { ignore } },
};
