/**
 * Simple View Transition Test Component
 * 
 * Click the button to test if View Transitions are working.
 * If they work, you'll see a dramatic 1-second animated transition.
 */

import React, { useState } from 'react';
import { withViewTransition, applyViewTransitionName } from '../utils/viewTransitions';

export const ViewTransitionTest: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    console.log('🧪 Test: Toggling view transition test');
    withViewTransition(() => {
      setIsExpanded(!isExpanded);
    });
  };

  return (
    <div className="p-8 bg-dark-100 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">View Transition API Test</h2>
          <p className="text-sm text-dark-600 mb-4">
            Click the button below. If View Transitions work, you should see a 
            dramatic 1-second animation with rotation and scaling.
          </p>
          <p className="text-xs text-dark-500 mb-6">
            Check the browser console for detailed logs.
          </p>
          
          <button
            onClick={handleToggle}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Toggle Transition Test
          </button>
        </div>

        {/* Test element that transitions */}
        <div
          ref={applyViewTransitionName('test-box')}
          className={`
            transition-all duration-300
            ${isExpanded 
              ? 'w-full h-96 bg-green-500' 
              : 'w-32 h-32 bg-blue-500'
            }
            rounded-lg flex items-center justify-center text-white font-bold
          `}
        >
          {isExpanded ? 'EXPANDED' : 'SMALL'}
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-2">
            What to look for:
          </h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Check console for "🎬 Starting view transition..." messages</li>
            <li>Box should animate for 1 full second (not instant)</li>
            <li>Should see rotation and dramatic scaling effects</li>
            <li>If you see instant changes = View Transitions not working</li>
          </ul>
        </div>

        <div className="text-xs text-dark-500 space-y-1">
          <p><strong>Browser Support:</strong></p>
          <p>✅ Chrome/Edge 111+</p>
          <p>✅ Safari 18+</p>
          <p>❌ Firefox (not yet supported)</p>
          <p className="mt-2">
            <strong>Your browser:</strong> {
              'startViewTransition' in document 
                ? '✅ Supports View Transitions!' 
                : '❌ Does not support View Transitions'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

