const path = require('path');
const PACKAGES = path.resolve(__dirname, '../../packages');

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/main.ts',
    '!**/app.module.ts',
    '!**/*.spec.ts',
    '!**/infrastructure/**',
    '!**/presentation/**',
    '!**/application/jobs/**',
    '!**/*.interface.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@paiol/types$': `${PACKAGES}/types/src/index.ts`,
    '^@paiol/validators$': `${PACKAGES}/validators/src/index.ts`,
    '^@paiol/utils$': `${PACKAGES}/utils/src/index.ts`,
    '^@domain/(.*)$': '<rootDir>/domain/$1',
    '^@application/(.*)$': '<rootDir>/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/presentation/$1',
  },
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 75, lines: 80 },
  },
};
