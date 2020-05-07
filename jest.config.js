/** @type Partial<import("@jest/types").Config.GlobalConfig> */
module.exports = {
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    __DEV__: true,
    __TEST__: true,
    __E2E__: false,
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      require.resolve('babel-jest'),
      { rootMode: 'upward' },
    ],
  },
  reporters: ['default', 'jest-github-reporter'],
  testRunner: 'jest-circus/runner',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  moduleDirectories: ['node_modules'],
  testPathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/node_modules/'],
  testRegex: '/__tests__/.*\\.spec\\.tsx?$',
  testEnvironment: 'node',
  coverageReporters: ['json', 'lcov', 'text-summary', 'clover'],
  coverageThreshold: {
    global: {
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.d.ts',
    '/__tests__/',
    '/__fixtures__/',
  ],
  collectCoverage: true,
  cacheDirectory: '<rootDir>/.jest',
};
