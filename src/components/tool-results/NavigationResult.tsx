/**
 * NavigationResult - Overlay for navigation tool results
 * Shows design system lists, previews, and help information
 */

import React from 'react';
import { formatRelativeTime, formatDate } from '../../utils/dateFormatters';
import { XIcon } from '../icons';

interface NavigationResultProps {
  result: {
    type: 'list' | 'preview' | 'help';
    data: any;
  };
  onClose: () => void;
}

export const NavigationResult: React.FC<NavigationResultProps> = ({ result, onClose }) => {
  const { type, data } = result;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {type === 'list' && '📚 Design Systems'}
            {type === 'preview' && '👁️ System Preview'}
            {type === 'help' && '❓ Help'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {type === 'list' && <SystemListView systems={data} />}
          {type === 'preview' && <SystemPreviewView system={data} />}
          {type === 'help' && <HelpView help={data} />}
        </div>
      </div>
    </div>
  );
};

// System List View
const SystemListView: React.FC<{ systems: any[] }> = ({ systems }) => {
  if (!systems || systems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No design systems found.</p>
        <p className="text-sm mt-2">Say "create new design system" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {systems.map((system) => (
        <div
          key={system.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{system.name}</h3>
              {system.description && (
                <p className="text-sm text-gray-600 mt-1">{system.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{system.tokenCount}</span> tokens
                </span>
                <span className="flex items-center gap-1">
                  Updated {formatRelativeTime(system.lastModified, { abbreviated: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// System Preview View
const SystemPreviewView: React.FC<{ system: any }> = ({ system }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{system.name}</h3>
        {system.description && (
          <p className="text-gray-600 mt-2">{system.description}</p>
        )}
      </div>

      {system.preview && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Tokens" value={system.preview.totalTokens} />
          <StatCard label="Primitives" value={system.preview.primitives} />
          <StatCard label="Utilities" value={system.preview.utilities} />
          <StatCard label="Specs" value={system.preview.specs} />
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Created:</span> {formatDate(system.createdAt)}
        </p>
        <p>
          <span className="font-medium">Last Modified:</span> {formatDate(system.lastModified)}
        </p>
        <p>
          <span className="font-medium">ID:</span> <code className="text-xs bg-gray-100 px-2 py-1 rounded">{system.id}</code>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 Say <strong>"load {system.name}"</strong> to open this system for editing
        </p>
      </div>
    </div>
  );
};

// Help View
const HelpView: React.FC<{ help: any }> = ({ help }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
        <ul className="space-y-2">
          {help.features?.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-green-500 mt-1">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
        <ul className="space-y-2">
          {help.nextSteps?.map((step: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-500 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-900">
          🎤 <strong>Try it now:</strong> Just start talking! The AI will guide you through creating or loading a design system.
        </p>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);


