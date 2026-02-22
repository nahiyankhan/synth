import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "../utils/apiKeyStorage";

// Helper to clean base64 string (remove data URL prefix if present)
const cleanBase64 = (data: string) => {
  if (data.includes(',')) {
    return data.split(',')[1];
  }
  return data;
};

export const analyzeImageForContext = async (base64Image: string): Promise<string> => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) throw new Error("API Key missing. Please set your API key in settings.");
  
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
  const rawBase64 = cleanBase64(base64Image);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png', 
            data: rawBase64
          },
          mediaResolution: {
            level: 'media_resolution_high'
          }
        },
        { 
          text: `Analyze this image as a design system expert. Extract actionable design tokens:

1. COLOR PALETTE: Identify 3-5 dominant colors with hex approximations (e.g., "Navy primary #1a3a52, Coral accent #ff6b6b")
2. TYPOGRAPHY: Font families, sizes in pt/px, weights, line-heights if visible (e.g., "Sans-serif, base 16px, headings 24-32px, medium weight")
3. SPACING: Consistent spacing values in px/rem (e.g., "8px base unit, 16/24/32px scale")
4. COMPONENTS: UI elements and their visual properties (e.g., "Rounded buttons 8px radius, card shadows 0 2px 8px rgba")
5. LAYOUT GRID: Column count, gutters, breakpoints if detectable

Format as concise bullet points optimized for voice readback. Prioritize extracting design token values over general descriptions. If certain categories aren't visible, skip them.`
        }
      ]
    }
  });

  const description = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!description) {
    throw new Error("Failed to analyze image");
  }
  
  return description;
};

