/** @type {import("jest").Config} */
module.exports = {
  preset: 'ts-jest',

  rootDir: 'src',

  testEnvironment: 'node',

  roots: ['<rootDir>/test'],

  testRegex: '.*\\.spec\\.ts$',

  collectCoverageFrom: [
    '**/*.ts',
    '!index.ts',
    '!**/*.module.ts',
    '!**/*.types.ts',
    '!**/*.spec.ts',
    '!test/**',
  ],

  coverageDirectory: '../coverage',

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  clearMocks: true,

  restoreMocks: true,

  verbose: true,
};
