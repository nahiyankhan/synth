import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withViewTransition,
  isViewTransitionSupported,
  createViewTransitionName,
  applyViewTransitionName,
} from '@/utils/viewTransitions';

describe('viewTransitions', () => {
  describe('isViewTransitionSupported', () => {
    it('should return false when startViewTransition is not available', () => {
      expect(isViewTransitionSupported()).toBe(false);
    });

    it('should return true when startViewTransition is available', () => {
      const mockStartViewTransition = vi.fn();
      (document as any).startViewTransition = mockStartViewTransition;
      
      expect(isViewTransitionSupported()).toBe(true);
      
      delete (document as any).startViewTransition;
    });
  });

  describe('createViewTransitionName', () => {
    it('should create a valid transition name', () => {
      expect(createViewTransitionName('card', 'colors')).toBe('card-colors');
      expect(createViewTransitionName('gallery', 'item-1')).toBe('gallery-item-1');
    });
  });

  describe('applyViewTransitionName', () => {
    it('should return a ref callback that sets view-transition-name', () => {
      const refCallback = applyViewTransitionName('my-element');
      expect(refCallback).toBeInstanceOf(Function);
      
      // Test that it sets the property on an element
      const mockElement = document.createElement('div');
      refCallback(mockElement);
      
      expect(mockElement.style.getPropertyValue('view-transition-name')).toBe('my-element');
    });

    it('should handle null elements gracefully', () => {
      const refCallback = applyViewTransitionName('my-element');
      expect(() => refCallback(null)).not.toThrow();
    });
  });

  describe('withViewTransition', () => {
    beforeEach(() => {
      delete (document as any).startViewTransition;
    });

    it('should run callback immediately when API is not supported', async () => {
      const callback = vi.fn();
      await withViewTransition(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should use startViewTransition when API is supported', async () => {
      const callback = vi.fn();
      
      let capturedCallback: (() => void) | null = null;
      const mockTransition = {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };
      
      const mockStartViewTransition = vi.fn((cb) => {
        capturedCallback = cb;
        // Immediately call the callback like the real API does
        cb();
        return mockTransition;
      });
      (document as any).startViewTransition = mockStartViewTransition;
      
      await withViewTransition(callback);
      
      expect(mockStartViewTransition).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      
      delete (document as any).startViewTransition;
    });

    it('should handle transition errors gracefully', async () => {
      const callback = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a mock transition with an immediately rejected finished promise
      // We need to ensure the catch handler is attached before rejection
      const mockTransition = {
        finished: new Promise<void>((resolve, reject) => {
          // Schedule rejection for next tick to allow catch handler to attach
          queueMicrotask(() => reject(new Error('Transition failed')));
        }),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };
      
      const mockStartViewTransition = vi.fn((cb) => {
        cb(); // Call the callback
        return mockTransition;
      });
      (document as any).startViewTransition = mockStartViewTransition;
      
      // Should not throw - catches and handles error gracefully
      await withViewTransition(callback);
      
      // Verify error was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('View transition failed'),
        expect.any(Error)
      );
      
      // Callback should still have been called
      expect(callback).toHaveBeenCalledTimes(1);
      
      consoleWarnSpy.mockRestore();
      delete (document as any).startViewTransition;
    });
  });
});

