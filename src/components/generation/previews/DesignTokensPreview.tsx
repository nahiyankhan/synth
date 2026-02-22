/**
 * DesignTokensPreview - Preview for design tokens phase
 *
 * Shows token counts by category with streaming support.
 */

import React from "react";

interface DesignTokensPreviewProps {
  data: {
    colorTokens?: number;
    typographyTokens?: number;
    spacingTokens?: number;
    motionTokens?: number;
    tokenCount?: number;
  };
}

const TokenCategory: React.FC<{
  label: string;
  count?: number;
  color: string;
}> = ({ label, count, color }) => (
  <div className="bg-dark-700 rounded-lg p-3 text-center min-w-[80px]">
    <div className={`text-xl font-semibold ${color}`}>
      {count !== undefined ? count : "..."}
    </div>
    <div className="text-xs text-dark-400">{label}</div>
  </div>
);

export const DesignTokensPreview: React.FC<DesignTokensPreviewProps> = ({
  data,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <TokenCategory
        label="Colors"
        count={data?.colorTokens}
        color="text-blue-400"
      />
      <TokenCategory
        label="Typography"
        count={data?.typographyTokens}
        color="text-purple-400"
      />
      <TokenCategory
        label="Spacing"
        count={data?.spacingTokens}
        color="text-green-400"
      />
      <TokenCategory
        label="Motion"
        count={data?.motionTokens}
        color="text-amber-400"
      />
      <div className="bg-dark-600 rounded-lg p-3 text-center min-w-[100px]">
        <div className="text-2xl font-semibold text-dark-100">
          {data?.tokenCount !== undefined ? data.tokenCount : "..."}
        </div>
        <div className="text-xs text-dark-400">Total</div>
      </div>
    </div>
    <p className="text-dark-400 text-sm">
      Design tokens for colors, typography, spacing, and motion form the
      foundation of your design system.
    </p>
  </div>
);
