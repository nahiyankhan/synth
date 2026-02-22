/**
 * UI Playground Page
 *
 * Generate UI from natural language prompts and preview with different design languages.
 * Uses json-render for rendering the generated UI tree.
 * Demonstrates the power of design language swapping - same UI structure, different visual styles.
 *
 * Design Language Integration:
 * - TokenProvider enables token resolution in generated UIs
 * - Graph is passed to generation for token context in AI prompts
 * - Generated UIs can use { token: "name" } for styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Renderer, JSONUIProvider, DataProvider } from '@json-render/react';
import type { UITree } from '@json-render/core';
import { useUIGeneration } from '../hooks/useUIGeneration';
import { componentRegistry, FallbackComponent } from '../lib/json-render';
import { TokenProvider } from '../lib/token-context';
import { useDesignLanguage } from '../context/DesignLanguageContext';
import { useDesignLanguageLoader } from '../hooks/useDesignLanguageLoader';

// =============================================================================
// Sample Data for Data Binding
// =============================================================================

const SAMPLE_DATA = {
  analytics: {
    revenue: 125000,
    growth: 0.15,
    users: 1234,
    orders: 567,
  },
  user: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  settings: {
    emailNotifications: true,
    darkMode: false,
    language: 'en',
  },
  form: {
    name: '',
    email: '',
    message: '',
  },
};
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, Sparkles, RefreshCw, Code, Eye } from 'lucide-react';

// =============================================================================
// Example Prompts
// =============================================================================

const EXAMPLE_PROMPTS = [
  'tip calculator with bill splitting',
  'expense tracker with category breakdown',
  'user profile card with stats and bio',
  'settings page with toggles and preferences',
  'todo list with priority levels',
  'sales dashboard with key metrics',
  'contact form with validation',
  'recipe card with ingredients list',
];

// =============================================================================
// Component
// =============================================================================

export const PlaygroundPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Load design language if not already loaded
  useDesignLanguageLoader();

  // Access design language context
  const { graph, currentLanguageMetadata } = useDesignLanguage();

  const {
    status,
    message,
    tree,
    streamContent,
    componentCount,
    generate,
    reset,
    isGenerating,
  } = useUIGeneration();

  // Fade in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle generate - pass graph for token context in AI prompt
  const handleGenerate = () => {
    if (prompt.trim()) {
      generate({ prompt, graph });
    }
  };

  // Handle example click
  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // Action handlers for json-render
  const handleAction = useCallback((action: { name: string; params?: Record<string, unknown> }) => {
    console.log('Action triggered:', action);
    // For now, just log actions - could integrate with actual handlers
  }, []);

  return (
    <div className="h-screen bg-white text-dark-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="w-full bg-white z-40 shrink-0">
        <div
          className={`px-12 pt-12 pb-4 transition-opacity duration-700 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => navigate("/")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors"
          >
            home
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <button
            onClick={() => navigate("/editor")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors lowercase"
          >
            {currentLanguageMetadata?.name || "untitled"}
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <span className="text-7xl font-bold tracking-tight text-dark-900 lowercase">
            playground
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Input Panel - 1/4 */}
            <div className="lg:col-span-1 space-y-6">
              {/* Prompt Input */}
              <div className="bg-white border border-dark-200 rounded-2xl p-6 space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Build a settings page with a profile section, notification toggles, and a danger zone with delete button..."
                  className="min-h-[140px] resize-none bg-dark-50 border-dark-200 text-dark-900 placeholder:text-dark-400"
                />

                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 bg-dark-900 text-white hover:bg-dark-800"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={reset}
                    disabled={isGenerating}
                    className="border-dark-200 text-dark-600 hover:bg-dark-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {message && (
                  <p className="text-sm text-dark-500">{message}</p>
                )}
              </div>

              {/* Example Prompts */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wide">
                  Try an example
                </h3>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="text-xs px-4 py-2 text-left rounded-full bg-dark-100 text-dark-700 hover:bg-dark-200 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Panel - 3/4 */}
            <div className="lg:col-span-3 bg-white border border-dark-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-dark-900">Preview</h2>
                {componentCount > 0 && (
                  <span className="px-3 py-1 bg-dark-100 text-dark-600 rounded-full text-sm">
                    {componentCount} components
                  </span>
                )}
              </div>

              <Tabs defaultValue="preview">
                <TabsList className="bg-dark-100">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-white">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="json" className="data-[state=active]:bg-white">
                    <Code className="w-4 h-4 mr-1.5" />
                    JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <div className="border border-dark-200 rounded-xl p-6 min-h-[400px]">
                    {tree ? (
                      <DataProvider initialData={SAMPLE_DATA}>
                        <TokenProvider>
                          <JSONUIProvider
                            registry={componentRegistry}
                            actionHandlers={{
                              click: handleAction,
                              submit: handleAction,
                              navigate: handleAction,
                              delete: handleAction,
                            }}
                          >
                            <Renderer
                              tree={tree as UITree}
                              registry={componentRegistry}
                              loading={isGenerating}
                              fallback={FallbackComponent}
                            />
                          </JSONUIProvider>
                        </TokenProvider>
                      </DataProvider>
                    ) : streamContent ? (
                      <div className="flex items-center gap-2 text-dark-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Building components...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-dark-400 py-16">
                        <Sparkles className="w-8 h-8 mb-3 opacity-50" />
                        <p className="text-sm">Generated UI will appear here</p>
                        <p className="text-xs mt-1 opacity-70">
                          Try one of the examples to get started
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="json" className="mt-4">
                  <pre className="bg-dark-50 border border-dark-200 p-4 rounded-xl overflow-auto text-xs text-dark-700 max-h-[400px] font-mono">
                    {tree
                      ? JSON.stringify(tree, null, 2)
                      : streamContent || '// No output yet'}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
