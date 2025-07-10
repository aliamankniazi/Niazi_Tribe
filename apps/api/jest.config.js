module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMappings: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  detectOpenHandles: true,
  forceExit: true,
}; 