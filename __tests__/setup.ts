// Jest setup file
// This runs before each test file

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console.error to keep test output clean
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Filter out expected errors during tests
    const message = args[0];
    if (typeof message === 'string' && message.includes('Expected error')) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});

