/**
 * Typography Preview Component
 * Displays the type stack
 */

import React from 'react';

interface TypographyData {
  typeStack?: {
    display?: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing?: string };
    h1?: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing?: string };
    h2?: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing?: string };
    h3?: { fontSize: string; lineHeight: string; fontWeight: string; letterSpacing?: string };
    body?: { fontSize: string; lineHeight: string; fontWeight?: string };
    bodyLarge?: { fontSize: string; lineHeight: string; fontWeight?: string };
    bodySmall?: { fontSize: string; lineHeight: string; fontWeight?: string };
    caption?: { fontSize: string; lineHeight: string; fontWeight?: string };
    label?: { fontSize: string; lineHeight: string; fontWeight: string; textTransform?: string };
    code?: { fontSize: string; lineHeight: string; fontFamily: string };
  };
  baseFont?: {
    family: string;
    fallback?: string;
  };
  reasoning?: string;
}

interface TypographyPreviewProps {
  data: TypographyData;
}

export const TypographyPreview: React.FC<TypographyPreviewProps> = ({ data }) => {
  const renderTypeStyle = (name: string, style: any, sampleText: string) => {
    if (!style) return null;

    return (
      <div key={name} className="border-b border-dark-700 pb-3 last:border-0">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs font-semibold text-dark-400 uppercase">{name}</p>
          <p className="text-xs text-dark-500 font-mono">
            {style.fontSize} · {style.lineHeight} · {style.fontWeight || '400'}
          </p>
        </div>
        <p
          style={{
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            fontWeight: style.fontWeight || '400',
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
            fontFamily: style.fontFamily || data.baseFont?.family || 'inherit'
          }}
          className="text-dark-100"
        >
          {sampleText}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">

      {data.baseFont && (
        <div className="mb-4 p-3 bg-dark-700 rounded-lg">
          <h4 className="text-xs font-semibold text-dark-400 uppercase mb-2">Base Font</h4>
          <p className="text-sm text-dark-100 font-medium">{data.baseFont.family}</p>
          {data.baseFont.fallback && (
            <p className="text-xs text-dark-400 font-mono mt-1">{data.baseFont.fallback}</p>
          )}
        </div>
      )}

      {data.typeStack && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-dark-400 uppercase">Type Stack</h4>
          {renderTypeStyle('Display', data.typeStack.display, 'Design Systems')}
          {renderTypeStyle('Heading 1', data.typeStack.h1, 'Primary Heading')}
          {renderTypeStyle('Heading 2', data.typeStack.h2, 'Secondary Heading')}
          {renderTypeStyle('Heading 3', data.typeStack.h3, 'Tertiary Heading')}
          {renderTypeStyle('Body Large', data.typeStack.bodyLarge, 'Large body text for emphasis and introductions.')}
          {renderTypeStyle('Body', data.typeStack.body, 'The default body text style for paragraphs and content.')}
          {renderTypeStyle('Body Small', data.typeStack.bodySmall, 'Smaller body text for secondary information.')}
          {renderTypeStyle('Caption', data.typeStack.caption, 'Caption and helper text')}
          {renderTypeStyle('Label', data.typeStack.label, 'BUTTON LABEL')}
          {renderTypeStyle('Code', data.typeStack.code, 'const example = "code";')}
        </div>
      )}

      {data.reasoning && (
        <div className="p-3 bg-dark-700 rounded-lg">
          <h4 className="text-xs font-semibold text-dark-400 uppercase mb-1">Strategy</h4>
          <p className="text-sm text-dark-200 leading-relaxed">{data.reasoning}</p>
        </div>
      )}
    </div>
  );
};
