/**
 * Multimodal input types for design system generation
 */

export interface ImageAttachment {
  id: string;
  type: 'file' | 'url';
  source: string;        // base64 for file, URL string for url
  mimeType: string;
  name?: string;
  previewUrl: string;    // for UI display (blob URL or original URL)
}

export interface GenerationRequest {
  prompt: string;
  images?: ImageAttachment[];
}
