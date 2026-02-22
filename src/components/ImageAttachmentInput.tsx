/**
 * ImageAttachmentInput - Reusable component for image attachment
 * Supports file upload (drag & drop + click) and URL input
 */

import React, { useState, useRef, useCallback } from 'react';
import type { ImageAttachment } from '../types/multimodal';

interface ImageAttachmentInputProps {
  attachments: ImageAttachment[];
  onAddFile: (file: File) => Promise<boolean>;
  onAddUrl: (url: string) => Promise<boolean>;
  onRemove: (id: string) => void;
  canAddMore: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export const ImageAttachmentInput: React.FC<ImageAttachmentInputProps> = ({
  attachments,
  onAddFile,
  onAddUrl,
  onRemove,
  canAddMore,
  compact = false,
  disabled = false,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragging(true);
    }
  }, [disabled, canAddMore]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (disabled || !canAddMore) return;

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const success = await onAddFile(file);
        if (!success) {
          setError('Failed to add image. Check file type or limit.');
          break;
        }
      }
    }
  }, [disabled, canAddMore, onAddFile]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const success = await onAddFile(file);
      if (!success) {
        setError('Failed to add image. Check file type or limit.');
        break;
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAddFile]);

  const handleUrlSubmit = useCallback(async () => {
    setError(null);
    if (!urlInput.trim()) return;

    const success = await onAddUrl(urlInput.trim());
    if (success) {
      setUrlInput('');
      setShowUrlInput(false);
    } else {
      setError('Invalid image URL. Must end with .png, .jpg, .webp, or .gif');
    }
  }, [urlInput, onAddUrl]);

  const handleUrlKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
    } else if (e.key === 'Escape') {
      setShowUrlInput(false);
      setUrlInput('');
    }
  }, [handleUrlSubmit]);

  // Compact variant for chat input
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Thumbnails */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative w-12 h-12 rounded-lg overflow-hidden border border-dark-200"
              >
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove(attachment.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        {canAddMore && !disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-dark-500 hover:text-dark-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-dark-500 hover:text-dark-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              URL
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* URL input */}
        {showUrlInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              placeholder="https://example.com/image.png"
              className="flex-1 px-2 py-1 text-xs bg-white border border-dark-200 rounded"
              autoFocus
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-2 py-1 text-xs bg-dark-200 rounded hover:bg-dark-300"
            >
              Add
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Full variant for GenerationPromptView
  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && canAddMore && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-dark-200 hover:border-dark-300'
          }
          ${disabled || !canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-6 h-6 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-dark-500">
            {canAddMore
              ? 'Drop images here or click to browse'
              : 'Maximum images reached'
            }
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || !canAddMore}
        />
      </div>

      {/* URL input toggle */}
      {canAddMore && !disabled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-sm text-dark-500 hover:text-dark-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {showUrlInput ? 'Hide URL input' : 'Or add image from URL'}
          </button>
        </div>
      )}

      {/* URL input field */}
      {showUrlInput && canAddMore && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com/image.png"
            className="flex-1 px-4 py-2 bg-white border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || disabled}
            className="px-4 py-2 bg-dark-200 text-dark-700 rounded-lg text-sm hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-dark-200">
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <p className="text-xs text-dark-400 mt-1 truncate max-w-20">
                {attachment.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
