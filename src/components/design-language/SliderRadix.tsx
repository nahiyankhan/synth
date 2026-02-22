import React from 'react';
import { cn } from '@/lib/utils';
import { SliderWithLabel } from '@/components/primitives';
import * as RadixSlider from '@radix-ui/react-slider';

export interface SliderRadixProps {
  /** Current value (controlled) */
  value?: number[];
  /** Default value (uncontrolled) */
  defaultValue?: number[];
  /** Callback when value changes */
  onValueChange?: (value: number[]) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Show value label */
  showValue?: boolean;
  /** Custom label for the slider */
  label?: string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Slider class name */
  className?: string;
}

/**
 * SliderRadix - Radix-powered range slider component
 *
 * A horizontal range slider that uses Radix UI primitives for enhanced
 * accessibility and adapts to the active design language theme.
 *
 * Features:
 * - Full keyboard navigation (arrow keys, Home, End)
 * - Proper ARIA attributes
 * - Touch-friendly for mobile devices
 * - Smooth dragging interaction
 * - Customizable min/max/step values
 * - Optional value display
 * - Theme-aware (respects data-theme attribute)
 * - Disabled state support
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState([50]);
 * 
 * // Basic slider
 * <SliderRadix
 *   value={value}
 *   onValueChange={setValue}
 * />
 *
 * // With label and value display
 * <SliderRadix
 *   label="Volume"
 *   value={value}
 *   onValueChange={setValue}
 *   showValue
 * />
 *
 * // Disabled slider
 * <SliderRadix
 *   value={[30]}
 *   disabled
 * />
 *
 * // Custom range
 * <SliderRadix
 *   min={0}
 *   max={200}
 *   step={5}
 *   value={value}
 *   onValueChange={setValue}
 * />
 * ```
 */
export function SliderRadix({
  value,
  defaultValue = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = false,
  label,
  disabled = false,
  className,
  containerClassName,
}: SliderRadixProps) {
  return (
    <SliderWithLabel
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      label={label}
      showValue={showValue}
      containerClassName={containerClassName}
      className={className}
    />
  );
}

/**
 * SliderCompactRadix - Compact Radix slider without label
 *
 * A minimal version of the Radix slider component without labels or value display.
 * Useful for compact UIs or inline controls.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState([50]);
 * <SliderCompactRadix value={value} onValueChange={setValue} />
 * ```
 */
export function SliderCompactRadix(
  props: Omit<SliderRadixProps, 'label' | 'showValue'>
) {
  return <SliderRadix {...props} label={undefined} showValue={false} />;
}

// Also export a simple wrapper that matches the old API (single number instead of array)
export interface SliderRadixSimpleProps
  extends Omit<SliderRadixProps, 'value' | 'onValueChange' | 'defaultValue'> {
  /** Current value (single number) */
  value?: number;
  /** Default value (single number) */
  defaultValue?: number;
  /** Callback when value changes (single number) */
  onChange?: (value: number) => void;
}

/**
 * SliderRadixSimple - Simple API wrapper for SliderRadix
 *
 * Same as SliderRadix but uses single number values instead of arrays
 * to match the original Slider component API more closely.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState(50);
 * <SliderRadixSimple value={value} onChange={setValue} />
 * ```
 */
export function SliderRadixSimple({
  value,
  defaultValue,
  onChange,
  ...props
}: SliderRadixSimpleProps) {
  const handleValueChange = (values: number[]) => {
    onChange?.(values[0]);
  };

  return (
    <SliderRadix
      value={value !== undefined ? [value] : undefined}
      defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
      onValueChange={handleValueChange}
      {...props}
    />
  );
}





