/**
 * ColorProposalView - Visual feedback for color tools
 * Displays multi-option proposals, harmony analysis, similarity results, etc.
 */

import React, { useState } from 'react';
import {
  ColorOptionProposal,
  SimilarityResult,
  LightnessScaleResult,
  ColorScaleProposal,
  ContrastCheckResult,
  HueGroupingResult
} from '../../types/visualFeedback';

// Simple SVG icons
const Sparkles: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const Check: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface ColorProposalViewProps {
  data: any; // Union of all color result types
  toolName: string;
  onClose: () => void;
}

export const ColorProposalView: React.FC<ColorProposalViewProps> = ({
  data,
  toolName,
  onClose
}) => {
  // Route to appropriate component based on tool name
  switch (toolName) {
    case 'adjust_colors_lightness':
    case 'generate_color_scale':
      return <MultiOptionProposal data={data as ColorOptionProposal | ColorScaleProposal} onClose={onClose} />;
    
    case 'find_similar_colors':
      return <SimilarityView data={data as SimilarityResult} onClose={onClose} />;
    
    case 'check_lightness_scale':
      return <LightnessScaleView data={data as LightnessScaleResult} onClose={onClose} />;
    
    case 'check_color_contrast':
      return <ContrastCheckView data={data as ContrastCheckResult} onClose={onClose} />;
    
    case 'group_colors_by_hue':
      return <HueGroupingView data={data as HueGroupingResult} onClose={onClose} />;
    
    default:
      return <div>Unknown color tool: {toolName}</div>;
  }
};

/**
 * Multi-Option Proposal - Shows 3 options side by side
 */
const MultiOptionProposal: React.FC<{
  data: ColorOptionProposal | ColorScaleProposal;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'animated'>('split');

  const isColorProposal = 'affectedHues' in data;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-dark-900">
                {data.question || 'Choose your preferred option'}
              </h2>
              <p className="text-sm text-dark-500 mt-1">
                {isColorProposal && (data as ColorOptionProposal).customizationHint}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-500 text-white'
                  : 'bg-dark-100 text-dark-600'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('animated')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                viewMode === 'animated'
                  ? 'bg-blue-500 text-white'
                  : 'bg-dark-100 text-dark-600'
              }`}
            >
              Animated Preview
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {data.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isRecommended={option.id === data.recommendedOptionId}
                isSelected={option.id === selectedOptionId}
                onClick={() => setSelectedOptionId(option.id)}
              />
            ))}
          </div>

          {/* Selected Option Details */}
          {selectedOptionId && (
            <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">
                    Ready to apply this option?
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This will update the selected colors. You can undo if needed.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOptionId(null)}
                    className="px-4 py-2 text-dark-600 hover:text-dark-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Apply the selected option
                      console.log('Apply option:', selectedOptionId);
                      onClose();
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Option Card - Single option in the grid
 */
const OptionCard: React.FC<{
  option: any;
  isRecommended: boolean;
  isSelected: boolean;
  onClick: () => void;
}> = ({ option, isRecommended, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
          : isRecommended
          ? 'border-blue-500 bg-blue-50/50 hover:shadow-xl'
          : 'border-dark-200 bg-white hover:border-dark-300 hover:shadow-lg'
      }`}
    >
      {/* Recommendation Badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI Recommends
        </div>
      )}

      {/* Option Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg text-dark-900">
            {option.name}
          </h3>
          <ConfidenceBadge score={option.confidence} />
        </div>
        <p className="text-sm text-dark-600">
          {option.description}
        </p>
      </div>

      {/* Color Previews */}
      {option.preview && Array.isArray(option.preview) && (
        <div className="space-y-2 mb-4">
          {option.preview.slice(0, 3).map((change: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <div
                className="w-8 h-8 rounded border border-dark-200"
                style={{ backgroundColor: change.before?.hex || change.hex }}
              />
              <ChevronRight className="w-4 h-4 self-center text-dark-400" />
              <div
                className="w-8 h-8 rounded border border-dark-200"
                style={{ backgroundColor: change.after?.hex || change.hex }}
              />
              <div className="flex-1 text-xs text-dark-500 self-center truncate">
                {change.token || change.suggestedName}
              </div>
            </div>
          ))}
          {option.preview.length > 3 && (
            <div className="text-xs text-dark-400">
              +{option.preview.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Scale Previews */}
      {option.scale && (
        <div className="flex gap-1 mb-4">
          {option.scale.map((item: any) => (
            <div
              key={item.level}
              className="flex-1 h-12 rounded"
              style={{ backgroundColor: item.hex }}
              title={`${item.level}: ${item.hex}`}
            />
          ))}
        </div>
      )}

      {/* Impact Summary */}
      <div className="pt-4 border-t border-dark-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-500">
            {option.changesCount || option.scale?.length || 0} changes
          </span>
          <span className={`font-medium ${
            option.estimatedImpact === 'low' ? 'text-green-600' :
            option.estimatedImpact === 'medium' ? 'text-yellow-600' :
            'text-orange-600'
          }`}>
            {option.estimatedImpact || 'medium'} impact
          </span>
        </div>
      </div>

      {/* Reasoning (on hover) */}
      {isHovered && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur rounded-2xl p-6 flex flex-col">
          <div className="flex-1">
            <div className="text-xs text-dark-500 uppercase tracking-wide mb-2">
              Why this option?
            </div>
            <div className="text-sm text-dark-700 italic">
              "{option.reasoning}"
            </div>
          </div>
          {option.usageNotes && (
            <div className="mt-4 text-xs text-dark-600">
              {option.usageNotes}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

/**
 * Confidence Badge
 */
const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
  const getConfig = (score: number) => {
    if (score >= 90) return { label: 'High', color: 'green', bars: 5 };
    if (score >= 70) return { label: 'Good', color: 'blue', bars: 4 };
    if (score >= 50) return { label: 'Fair', color: 'yellow', bars: 3 };
    return { label: 'Low', color: 'orange', bars: 2 };
  };

  const config = getConfig(score);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-1 h-3 rounded-full ${
              level <= config.bars
                ? `bg-${config.color}-500`
                : `bg-${config.color}-200${config.color}-900`
            }`}
          />
        ))}
      </div>
      <span className={`text-xs text-${config.color}-700${config.color}-300`}>
        {config.label}
      </span>
    </div>
  );
};

// Placeholder components for other views
const SimilarityView: React.FC<{ data: SimilarityResult; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Similar Colors</h2>
        <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-6">
        <div className="text-sm text-dark-500 mb-2">Target Color:</div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg border border-dark-200" style={{ backgroundColor: data.targetColor.value }} />
          <div>
            <div className="font-medium">{data.targetColor.path}</div>
            <div className="text-sm text-dark-500">{data.targetColor.value}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="font-medium">Found {data.similarColors.length} similar colors:</div>
        {data.similarColors.map((color) => (
          <div key={color.path} className="flex items-center gap-3 p-3 bg-dark-50 rounded-lg">
            <div className="w-12 h-12 rounded border border-dark-200" style={{ backgroundColor: color.value }} />
            <div className="flex-1">
              <div className="font-medium text-sm">{color.path}</div>
              <div className="text-xs text-dark-500">Distance: {(color.distance * 100).toFixed(1)}%</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              color.recommendation === 'consolidate' ? 'bg-orange-100 text-orange-700' :
              color.recommendation === 'review' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {color.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LightnessScaleView: React.FC<{ data: LightnessScaleResult; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Lightness Scale: {data.hueFamily}</h2>
        <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-4">
        <div className="inline-block px-3 py-1 rounded-full text-sm bg-dark-100">
          Scale Type: <span className="font-medium capitalize">{data.scaleType}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Current Colors:</div>
          <div className="space-y-2">
            {data.colors.map((color) => (
              <div key={color.path} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded border border-dark-200" style={{ backgroundColor: color.value }} />
                <div>
                  <div className="text-sm font-medium">{color.path}</div>
                  <div className="text-xs text-dark-500">Lightness: {(color.lightness * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.gaps.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Suggested Fills ({data.gaps.length} gaps):</div>
            <div className="space-y-2">
              {data.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                  <div className="w-12 h-12 rounded border border-blue-200" style={{ backgroundColor: gap.suggestedValue }} />
                  <div>
                    <div className="text-sm font-medium">{gap.suggestedName}</div>
                    <div className="text-xs text-dark-500">Lightness: {(gap.missingLightness * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-dark-600 italic">
          {data.recommendation}
        </div>
      </div>
    </div>
  </div>
);

const ContrastCheckView: React.FC<{ data: ContrastCheckResult; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Contrast Check</h2>
        <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-light mb-2">{data.contrastRatio.toFixed(2)}:1</div>
        <div className="text-dark-500">Contrast Ratio</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-dark-50 rounded-lg">
          <div className="text-sm font-medium mb-2">WCAG AA</div>
          <div className="space-y-1 text-sm">
            <div className={data.wcagAA.normalText ? 'text-green-600' : 'text-red-600'}>
              {data.wcagAA.normalText ? '✓' : '✗'} Normal Text
            </div>
            <div className={data.wcagAA.largeText ? 'text-green-600' : 'text-red-600'}>
              {data.wcagAA.largeText ? '✓' : '✗'} Large Text
            </div>
          </div>
        </div>

        <div className="p-4 bg-dark-50 rounded-lg">
          <div className="text-sm font-medium mb-2">WCAG AAA</div>
          <div className="space-y-1 text-sm">
            <div className={data.wcagAAA.normalText ? 'text-green-600' : 'text-red-600'}>
              {data.wcagAAA.normalText ? '✓' : '✗'} Normal Text
            </div>
            <div className={data.wcagAAA.largeText ? 'text-green-600' : 'text-red-600'}>
              {data.wcagAAA.largeText ? '✓' : '✗'} Large Text
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
        {data.recommendation}
      </div>
    </div>
  </div>
);

const HueGroupingView: React.FC<{ data: HueGroupingResult; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Color Groups by Hue</h2>
        <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {data.hueGroups.map((group) => (
          <div key={group.hueName} className="p-4 bg-dark-50 rounded-lg">
            <div className="font-medium mb-2">{group.hueName}</div>
            <div className="text-sm text-dark-500 mb-3">{group.count} colors</div>
            <div className="space-y-2">
              {group.colors.slice(0, 5).map((color) => (
                <div
                  key={color.path}
                  className="h-8 rounded border border-dark-200"
                  style={{ backgroundColor: color.value }}
                  title={color.path}
                />
              ))}
              {group.colors.length > 5 && (
                <div className="text-xs text-dark-400">+{group.colors.length - 5} more</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.underrepresentedHues.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm font-medium mb-2">Underrepresented Hues:</div>
          <div className="text-sm text-yellow-900">
            {data.underrepresentedHues.join(', ')}
          </div>
        </div>
      )}
    </div>
  </div>
);

