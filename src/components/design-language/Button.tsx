import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  prominence?: 'Standard' | 'Prominent' | 'Subtle';
  state?: 'Default' | 'Pressed' | 'Disabled' | 'Loading';
  destructive?: boolean;
  children?: React.ReactNode;
}

/**
 * Button - Default button component
 *
 * The standard button size (44px height) for general use cases.
 * Sits between ButtonCta (52px) and ButtonCompact (32px) in size hierarchy.
 * 
 * Features:
 * - Multiple prominence levels (Prominent, Standard, Subtle)
 * - Built-in loading state with spinner
 * - Destructive variants for dangerous actions
 * - Optional icon support
 * 
 * @example
 * ```tsx
 * // Prominent button (black background)
 * <Button label="Continue" prominence="Prominent" />
 * 
 * // With loading state
 * <Button label="Processing" prominence="Prominent" state="Loading" />
 * 
 * // Destructive action
 * <Button label="Delete Account" prominence="Prominent" destructive />
 * 
 * // With icon
 * <Button icon={<CheckIcon />} showIcon prominence="Standard">
 *   Verify
 * </Button>
 * ```
 */
export function Button({
  label = 'Button',
  icon,
  showIcon = false,
  prominence = 'Standard',
  state = 'Default',
  destructive = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || state === 'Disabled';
  const isPressed = state === 'Pressed';
  const isLoading = state === 'Loading';

  return (
    <button
      disabled={isDisabled || isLoading}
      data-state={state}
      data-prominence={prominence}
      data-destructive={destructive}
      className={cn(
        // Base styles - Medium button size (44px height)
        'inline-flex items-center justify-center gap-2',
        'w-full rounded-full px-6 h-[44px]',
        'font-cash-sans text-base font-medium leading-6',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        'whitespace-nowrap',

        // === PROMINENT VARIANTS ===
        // Prominent + Non-destructive (Black filled)
        prominence === 'Prominent' && !destructive && [
          'bg-dl-black text-dl-white',
          !isDisabled && !isPressed && !isLoading && 'hover:bg-dl-bg-inverse-pressed active:bg-dl-bg-inverse-pressed',
          isPressed && 'bg-dl-bg-inverse-pressed',
          isDisabled && 'bg-dl-bg-prominent text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-black',
        ],

        // Prominent + Destructive (Red filled)
        prominence === 'Prominent' && destructive && [
          'bg-dl-text-danger text-dl-white',
          !isDisabled && !isPressed && !isLoading && 'hover:opacity-90 active:opacity-80',
          isPressed && 'opacity-80',
          isDisabled && 'bg-dl-bg-prominent text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-text-danger',
        ],

        // === STANDARD VARIANTS ===
        // Standard + Non-destructive (Gray filled)
        prominence === 'Standard' && !destructive && [
          'bg-dl-bg-standard text-dl-text-standard',
          !isDisabled && !isPressed && !isLoading && 'hover:bg-dl-bg-prominent active:bg-dl-bg-prominent',
          isPressed && 'bg-dl-bg-prominent',
          isDisabled && 'bg-dl-bg-subtle text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-bg-prominent',
        ],

        // Standard + Destructive (Light red filled)
        prominence === 'Standard' && destructive && [
          'bg-dl-text-danger/10 text-dl-text-danger',
          !isDisabled && !isPressed && !isLoading && 'hover:bg-dl-text-danger/20 active:bg-dl-text-danger/30',
          isPressed && 'bg-dl-text-danger/30',
          isDisabled && 'bg-dl-bg-subtle text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-text-danger/30',
        ],

        // === SUBTLE VARIANTS ===
        // Subtle + Non-destructive (Transparent/minimal)
        prominence === 'Subtle' && !destructive && [
          'bg-transparent text-dl-text-standard',
          !isDisabled && !isPressed && !isLoading && 'hover:bg-dl-bg-subtle active:bg-dl-bg-standard',
          isPressed && 'bg-dl-bg-standard',
          isDisabled && 'text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-bg-standard',
        ],

        // Subtle + Destructive (Transparent with red text)
        prominence === 'Subtle' && destructive && [
          'bg-transparent text-dl-text-danger',
          !isDisabled && !isPressed && !isLoading && 'hover:bg-dl-text-danger/10 active:bg-dl-text-danger/20',
          isPressed && 'bg-dl-text-danger/20',
          isDisabled && 'text-dl-text-disabled opacity-40',
          'focus-visible:ring-dl-text-danger/20',
        ],

        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          {/* Loading Spinner */}
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children || label}
        </>
      ) : (
        <>
          {/* Icon (if provided and showIcon is true) */}
          {showIcon && icon && (
            <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
          )}
          
          {/* Label or children */}
          {children || label}
        </>
      )}
    </button>
  );
}

