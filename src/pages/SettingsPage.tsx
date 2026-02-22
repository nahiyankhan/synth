import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiKey } from '@/hooks/useApiKey';
import { XIcon } from '@/components/icons';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveApiKey, saveClaudeKey: saveClaudeKeyToStorage, getKey } = useApiKey();
  const [key, setKey] = useState(getKey('gemini') || '');
  const [claudeKey, setClaudeKey] = useState(getKey('claude') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      saveApiKey(key.trim());
      if (claudeKey.trim()) {
        saveClaudeKeyToStorage(claudeKey.trim());
      }
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 max-w-2xl w-full border border-dark-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-light tracking-tight text-dark-900">Settings</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-dark-400 hover:text-dark-900 transition-colors"
          >
            <XIcon className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-8">
          {/* API Key Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-500 mb-3 font-light">
                Gemini API Key (Required)
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="API Key"
                className="w-full bg-white border border-dark-200 text-dark-900 px-5 py-4 focus:outline-none focus:border-dark-400 font-light transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-dark-500 mb-3 font-light">
                Claude API Key (Optional - Enhanced Exploration)
              </label>
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="Optional: Claude API Key for better file system reasoning"
                className="w-full bg-white border border-dark-200 text-dark-900 px-5 py-4 focus:outline-none focus:border-dark-400 font-light transition-colors"
              />
              <p className="text-xs text-dark-500 mt-2 font-light">
                Claude Opus 4.5 excels at exploration queries (22% faster, 26% fewer tokens)
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-dark-900 text-white hover:bg-dark-700 py-4 font-light transition-colors tracking-wide"
            >
              Save API Keys
            </button>
          </form>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-white border border-dark-200 hover:bg-dark-50 text-dark-900 py-4 transition-colors font-light tracking-wide"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
