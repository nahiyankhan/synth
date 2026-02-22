/**
 * ToolResultHeader - Shared header component for tool result overlays
 *
 * Provides consistent styling across all tool result views with
 * title, subtitle, and close button.
 */

import React from 'react';
import { XIcon } from '../icons';

interface ToolResultHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle or description */
  subtitle?: React.ReactNode;
  /** Close button click handler */
  onClose: () => void;
  /** Use mono font for subtitle (for paths, queries, etc.) */
  subtitleMono?: boolean;
}

export const ToolResultHeader: React.FC<ToolResultHeaderProps> = ({
  title,
  subtitle,
  onClose,
  subtitleMono = false,
}) => {
  return (
    <div className="px-6 py-4 border-b border-dark-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-light text-dark-900">
            {title}
          </h2>
          {subtitle && (
            <p className={`text-sm text-dark-500 mt-1 font-light ${subtitleMono ? 'font-mono text-xs' : ''}`}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-dark-400 hover:text-dark-900 transition-colors"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
