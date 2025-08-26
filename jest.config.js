// Jest configuration for Puppeteer testing
// Based on patterns from the PDF guide

export default {
  // Use ts-jest to handle TypeScript files
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns - following PDF convention
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx'
  ],
  
  // Global setup file - runs before all test suites
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test timeout for browser operations (10 seconds)
  testTimeout: 10000,
  
  // Coverage configuration (optional)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx'
  ],
  
  // Module name mapper for path aliases if needed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  }
};