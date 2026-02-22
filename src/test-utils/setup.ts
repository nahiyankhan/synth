import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB with proper implementation
const mockRequest = {
  onsuccess: null as any,
  onerror: null as any,
  result: null as any,
};

const mockDatabase = {
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      getAll: vi.fn(() => ({ ...mockRequest, result: [] })),
      get: vi.fn(() => ({ ...mockRequest, result: null })),
      put: vi.fn(() => mockRequest),
      delete: vi.fn(() => mockRequest),
      add: vi.fn(() => mockRequest),
    })),
  })),
  createObjectStore: vi.fn(),
  deleteObjectStore: vi.fn(),
  close: vi.fn(),
};

const indexedDB = {
  open: vi.fn(() => {
    const request = { ...mockRequest, result: mockDatabase };
    // Simulate successful open
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: { result: mockDatabase } });
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(() => mockRequest),
  databases: vi.fn(() => Promise.resolve([])),
};

global.indexedDB = indexedDB as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Mock performance.now for consistent timing
global.performance = global.performance || ({} as any);
global.performance.now = vi.fn(() => Date.now());

