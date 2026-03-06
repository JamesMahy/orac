import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@database/(.*)$': '<rootDir>/prisma/$1',
    '^@hosts/(.*)$': '<rootDir>/hosts/$1',
    '^@projects/(.*)$': '<rootDir>/projects/$1',
    '^@workspaces/(.*)$': '<rootDir>/workspaces/$1',
    '^@ssh/(.*)$': '<rootDir>/ssh/$1',
    '^@clankers/(.*)$': '<rootDir>/clankers/$1',
    '^@vaults/(.*)$': '<rootDir>/vaults/$1',
    '^@files/(.*)$': '<rootDir>/files/$1',
    '^@helpers/config$': '<rootDir>/helpers/config.helpers',
    '^@helpers/shell$': '<rootDir>/helpers/shell.helpers',
    '^@users/(.*)$': '<rootDir>/users/$1',
  },
};

export default config;
