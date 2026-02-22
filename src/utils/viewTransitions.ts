/**
 * View Transitions Utility
 * 
 * Helper functions for using the View Transition API with proper fallbacks.
 * The View Transition API allows smooth, animated transitions between DOM states.
 * 
 * Browser Support:
 * - Chrome/Edge 111+
 * - Safari 18+
 * - Firefox: Not yet supported (uses fallback)
 */

/**
 * Runs a state update with a view transition if supported, otherwise runs immediately
 * @param updateCallback - Function that updates state/DOM
 * @returns Promise that resolves when the transition completes (or immediately if not supported)
 */
export function withViewTransition(updateCallback: () => void): Promise<void> {
  if (document.startViewTransition) {
    console.log('🎬 Starting view transition...');
    const transition = document.startViewTransition(() => {
      // Use flushSync from react-dom to ensure synchronous update
      // This ensures DOM is updated before View Transition captures new state
      updateCallback();
    });
    
    // Attach handlers and return a properly caught promise
    return Promise.all([
      transition.ready.then(() => {
        console.log('✅ View transition ready - animating now');
      }),
      transition.finished.then(() => {
        console.log('✅ View transition finished');
      }).catch((error) => {
        console.warn('⚠️ View transition failed:', error);
        // If transition fails, that's okay - the DOM update still happened
      })
    ]).then(() => undefined);
  } else {
    console.log('ℹ️ View Transition API not supported - using fallback');
    // Fallback: run update immediately without transition
    updateCallback();
    return Promise.resolve();
  }
}

/**
 * Checks if View Transition API is supported
 * @returns true if the browser supports view transitions
 */
export function isViewTransitionSupported(): boolean {
  return 'startViewTransition' in document && typeof document.startViewTransition === 'function';
}

/**
 * Creates a view transition name for an element
 * Useful for creating unique transition names dynamically
 * @param prefix - Prefix for the transition name
 * @param id - Unique identifier
 * @returns A valid view-transition-name value
 */
export function createViewTransitionName(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

/**
 * Applies a view transition name to an element via ref callback
 * Since view-transition-name is not yet supported in React's style whitelist,
 * we use a ref to set it directly on the DOM element.
 * This is the official React pattern for unsupported CSS properties.
 * @param name - The view transition name
 * @returns Ref callback that sets the CSS property
 */
export function applyViewTransitionName(name: string) {
  return (element: HTMLElement | null) => {
    if (element) {
      element.style.setProperty('view-transition-name', name);
      console.log(`✅ Set view-transition-name="${name}" on:`, element.tagName, element.className);
      
      // Verify it was set
      const actual = element.style.getPropertyValue('view-transition-name');
      console.log(`   Verified: getPropertyValue returned "${actual}"`);
    }
  };
}

