import '@testing-library/jest-dom';
import { afterEach, afterAll, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup MSW server
export const server = setupServer();

beforeAll(() => {
  // Start the MSW server before all tests
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  // Close the MSW server after all tests
  server.close();
});

afterEach(() => {
  // Reset the MSW handlers between tests
  server.resetHandlers();
}); 