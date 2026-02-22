import React from 'react';
import { cn } from '@/lib/utils';
import { ModalButton } from './ModalButton';
import { ModalImagePlaceholder } from './ModalImagePlaceholder';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/primitives';

export interface ModalRadixProps {
  /**
   * Whether the modal is open
   */
  open?: boolean;
  /**
   * Callback when modal open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Modal title text
   */
  title?: string;
  /**
   * Modal description/body text (2-3 lines recommended)
   */
  description?: string;
  /**
   * Whether to show the image header
   */
  showImage?: boolean;
  /**
   * Custom image source for the header
   */
  imageSrc?: string;
  /**
   * Alt text for the image
   */
  imageAlt?: string;
  /**
   * Whether to show the primary action button
   */
  showPrimaryButton?: boolean;
  /**
   * Primary button label
   */
  primaryButtonLabel?: string;
  /**
   * Primary button click handler
   */
  onPrimaryClick?: () => void;
  /**
   * Whether the primary action is destructive
   */
  primaryDestructive?: boolean;
  /**
   * Whether to show the secondary action button
   */
  showSecondaryButton?: boolean;
  /**
   * Secondary button label
   */
  secondaryButtonLabel?: string;
  /**
   * Secondary button click handler
   */
  onSecondaryClick?: () => void;
  /**
   * Custom content to replace default title/description
   */
  children?: React.ReactNode;
  /**
   * Additional className for the modal content
   */
  className?: string;
}

/**
 * ModalRadix - A Radix-powered modal dialog component
 * 
 * A comprehensive modal component that uses Radix UI primitives for
 * accessibility and theme-aware styling. Adapts to the active design language.
 * 
 * Features:
 * - Full keyboard navigation and focus management
 * - Escape key to close
 * - Click outside to close
 * - Scroll locking when open
 * - Optional branded image header
 * - Structured title and description layout
 * - Primary and secondary action buttons
 * - Destructive action support
 * - Fully customizable content via children
 * - Theme-aware (respects data-theme attribute)
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * // Basic confirmation modal
 * <ModalRadix
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Confirm Action"
 *   description="Are you sure you want to continue with this action?"
 *   primaryButtonLabel="Confirm"
 *   secondaryButtonLabel="Cancel"
 *   onPrimaryClick={() => {
 *     console.log('Confirmed');
 *     setOpen(false);
 *   }}
 *   onSecondaryClick={() => setOpen(false)}
 * />
 * 
 * // Destructive action modal
 * <ModalRadix
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Account"
 *   description="This action cannot be undone. All your data will be permanently deleted."
 *   showImage={true}
 *   primaryButtonLabel="Delete Account"
 *   primaryDestructive={true}
 *   secondaryButtonLabel="Cancel"
 *   onPrimaryClick={handleDelete}
 * />
 * 
 * // With custom image
 * <ModalRadix
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Success!"
 *   description="Your payment has been processed successfully."
 *   showImage={true}
 *   imageSrc="https://example.com/success.jpg"
 *   primaryButtonLabel="Continue"
 * />
 * ```
 */
export function ModalRadix({
  open,
  onOpenChange,
  title = 'Title',
  description = 'Use a 2-3 line description to give more context or information.',
  showImage = false,
  imageSrc,
  imageAlt = 'Modal header image',
  showPrimaryButton = true,
  primaryButtonLabel = 'Primary action',
  onPrimaryClick,
  primaryDestructive = false,
  showSecondaryButton = true,
  secondaryButtonLabel = 'Cancel',
  onSecondaryClick,
  className,
  children,
}: ModalRadixProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden p-0',
          className
        )}
      >
        {/* Optional Image Header */}
        {showImage && (
          <ModalImagePlaceholder src={imageSrc} alt={imageAlt} />
        )}

        {/* Content Area */}
        {children ? (
          <div className="px-6 py-6">
            {children}
          </div>
        ) : (
          <div className="px-6 py-6 flex flex-col gap-3 text-center">
            {/* Title */}
            <DialogTitle className="font-[var(--dl-font-ui)] text-[var(--dl-text-size-title)] font-medium">
              {title}
            </DialogTitle>

            {/* Description */}
            <DialogDescription className="font-[var(--dl-font-ui)] text-[var(--dl-text-size-body)]">
              {description}
            </DialogDescription>
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter>
          {showPrimaryButton && (
            <ModalButton
              label={primaryButtonLabel}
              action="Primary"
              destructive={primaryDestructive}
              onClick={onPrimaryClick}
            />
          )}
          {showSecondaryButton && (
            <ModalButton
              label={secondaryButtonLabel}
              action="Secondary"
              onClick={onSecondaryClick}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





