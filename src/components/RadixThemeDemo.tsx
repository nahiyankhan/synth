import React, { useState } from 'react';
import { ModalRadix, SliderRadixSimple, Button } from './design-language';
import { cn } from '@/lib/utils';

/**
 * RadixThemeDemo - Demo component showing Radix primitives with theme switching
 * 
 * This component demonstrates:
 * - How Radix components adapt to different design languages
 * - Theme switching via data-theme attribute
 * - CSS variable-based theming
 */
export function RadixThemeDemo() {
  const [theme, setTheme] = useState<'default' | 'material' | 'fluent'>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  // Update the data-theme attribute when theme changes
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--dl-bg-app)] text-[var(--dl-text-standard)] p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Radix Theme Demo</h1>
          <p className="text-[var(--dl-text-subtle)]">
            See how Radix components adapt to different design languages
          </p>
        </div>

        {/* Theme Switcher */}
        <div className="bg-[var(--dl-bg-subtle)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Active Theme</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('default')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                theme === 'default'
                  ? 'bg-[var(--dl-bg-brand)] text-white'
                  : 'bg-[var(--dl-bg-standard)] hover:bg-[var(--dl-bg-prominent)]'
              )}
            >
              Default
            </button>
            <button
              onClick={() => setTheme('material')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                theme === 'material'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--dl-bg-standard)] hover:bg-[var(--dl-bg-prominent)]'
              )}
            >
              Material Design
            </button>
            <button
              onClick={() => setTheme('fluent')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                theme === 'fluent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--dl-bg-standard)] hover:bg-[var(--dl-bg-prominent)]'
              )}
            >
              Fluent Design
            </button>
          </div>
          <div className="text-sm text-[var(--dl-text-subtle)]">
            Current: <code className="bg-[var(--dl-bg-standard)] px-2 py-1 rounded">
              data-theme="{theme}"
            </code>
          </div>
        </div>

        {/* Modal Demo */}
        <div className="bg-[var(--dl-bg-subtle)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Dialog Component</h2>
          <p className="text-sm text-[var(--dl-text-subtle)]">
            Notice how the modal width, border radius, and spacing change based on the theme.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[var(--dl-bg-brand)] text-white px-6 py-3 rounded-[var(--dl-button-radius)] font-medium hover:opacity-90 transition-opacity"
          >
            Open Dialog
          </button>

          <ModalRadix
            open={modalOpen}
            onOpenChange={setModalOpen}
            title="Theme-Aware Dialog"
            description="This dialog automatically adapts its width, border radius, spacing, and typography based on the active design language theme."
            primaryButtonLabel="Got it!"
            onPrimaryClick={() => setModalOpen(false)}
            secondaryButtonLabel="Cancel"
            onSecondaryClick={() => setModalOpen(false)}
          />

          {/* CSS Variable Display */}
          <div className="mt-4 p-4 bg-[var(--dl-bg-standard)] rounded text-xs font-mono space-y-1">
            <div>--dl-modal-width: <span className="text-[var(--dl-bg-brand)]">{getComputedStyle(document.documentElement).getPropertyValue('--dl-modal-width')}</span></div>
            <div>--dl-radius-lg: <span className="text-[var(--dl-bg-brand)]">{getComputedStyle(document.documentElement).getPropertyValue('--dl-radius-lg')}</span></div>
            <div>--dl-font-ui: <span className="text-[var(--dl-bg-brand)]">{getComputedStyle(document.documentElement).getPropertyValue('--dl-font-ui')}</span></div>
          </div>
        </div>

        {/* Slider Demo */}
        <div className="bg-[var(--dl-bg-subtle)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Slider Component</h2>
          <p className="text-sm text-[var(--dl-text-subtle)]">
            The slider thumb size and track height adapt to the theme.
          </p>
          
          <SliderRadixSimple
            label="Volume"
            value={sliderValue}
            onChange={setSliderValue}
            showValue
            min={0}
            max={100}
            step={1}
          />

          {/* CSS Variable Display */}
          <div className="mt-4 p-4 bg-[var(--dl-bg-standard)] rounded text-xs font-mono space-y-1">
            <div>--dl-slider-thumb-size: <span className="text-[var(--dl-bg-brand)]">{getComputedStyle(document.documentElement).getPropertyValue('--dl-slider-thumb-size')}</span></div>
            <div>--dl-slider-track-height: <span className="text-[var(--dl-bg-brand)]">{getComputedStyle(document.documentElement).getPropertyValue('--dl-slider-track-height')}</span></div>
          </div>
        </div>

        {/* Theme Comparison Table */}
        <div className="bg-[var(--dl-bg-subtle)] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Theme Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--dl-bg-standard)]">
                <tr>
                  <th className="p-2 text-left">Property</th>
                  <th className="p-2 text-left">Default</th>
                  <th className="p-2 text-left">Material</th>
                  <th className="p-2 text-left">Fluent</th>
                </tr>
              </thead>
              <tbody className="text-[var(--dl-text-subtle)]">
                <tr className="border-t border-border">
                  <td className="p-2 font-medium">Modal Width</td>
                  <td className="p-2">343px</td>
                  <td className="p-2">560px</td>
                  <td className="p-2">480px</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2 font-medium">Border Radius</td>
                  <td className="p-2">24px (rounded)</td>
                  <td className="p-2">4px (subtle)</td>
                  <td className="p-2">2px (minimal)</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2 font-medium">Button Height</td>
                  <td className="p-2">44px</td>
                  <td className="p-2">36px</td>
                  <td className="p-2">32px</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2 font-medium">Typography</td>
                  <td className="p-2">System UI</td>
                  <td className="p-2">Roboto</td>
                  <td className="p-2">Segoe UI</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}





