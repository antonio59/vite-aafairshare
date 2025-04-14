import '@testing-library/jest-dom';
import { expect, afterEach, vi, afterAll, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { setupServer } from 'msw/node';

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers);

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

// Mock Firebase
vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn().mockReturnValue({}),
  };
});

vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn().mockReturnValue({}),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn().mockReturnValue(new Date()),
  };
}); 