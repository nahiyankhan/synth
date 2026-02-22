/**
 * useImageAttachments - Hook for managing image attachments for multimodal input
 */

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { ImageAttachment } from '../types/multimodal';

const MAX_IMAGES = 5;
const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

export function useImageAttachments() {
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);

  const addFileImage = useCallback(async (file: File): Promise<boolean> => {
    if (attachments.length >= MAX_IMAGES) {
      console.warn('Maximum number of images reached');
      return false;
    }

    if (!VALID_TYPES.includes(file.type)) {
      console.warn('Invalid file type:', file.type);
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix to get raw base64
        const base64Data = base64.split(',')[1];

        const attachment: ImageAttachment = {
          id: nanoid(),
          type: 'file',
          source: base64Data,
          mimeType: file.type,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        };

        setAttachments((prev) => [...prev, attachment]);
        resolve(true);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  }, [attachments.length]);

  const addUrlImage = useCallback(async (url: string): Promise<boolean> => {
    if (attachments.length >= MAX_IMAGES) {
      console.warn('Maximum number of images reached');
      return false;
    }

    // Validate URL format
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const isValidExtension = VALID_EXTENSIONS.some((ext) => pathname.endsWith(ext));

      if (!isValidExtension) {
        console.warn('URL must point to an image file (png, jpg, webp, gif)');
        return false;
      }

      // Infer MIME type from extension
      let mimeType = 'image/png';
      if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (pathname.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else if (pathname.endsWith('.gif')) {
        mimeType = 'image/gif';
      }

      const attachment: ImageAttachment = {
        id: nanoid(),
        type: 'url',
        source: url,
        mimeType,
        name: pathname.split('/').pop() || 'image',
        previewUrl: url,
      };

      setAttachments((prev) => [...prev, attachment]);
      return true;
    } catch {
      console.warn('Invalid URL');
      return false;
    }
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      // Revoke blob URL if it's a file attachment
      if (attachment?.type === 'file' && attachment.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    // Revoke all blob URLs
    attachments.forEach((attachment) => {
      if (attachment.type === 'file' && attachment.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
    setAttachments([]);
  }, [attachments]);

  return {
    attachments,
    addFileImage,
    addUrlImage,
    removeAttachment,
    clearAttachments,
    canAddMore: attachments.length < MAX_IMAGES,
  };
}
