import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiKey } from "@/hooks/useApiKey";

export const ApiKeyPage: React.FC = () => {
  const { saveApiKey } = useApiKey();
  const navigate = useNavigate();
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      saveApiKey(key.trim());
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-sm font-mono text-dark-400 mb-4">dla-01</p>
          <h1 className="text-4xl font-medium mb-3 tracking-tight">
            Design Language Agent
          </h1>
          <p className="text-sm text-dark-400">
            Enter your Gemini API key to begin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Gemini API Key"
            autoComplete="off"
            className="w-full bg-dark-800 text-dark-50 placeholder-dark-500 px-5 py-4 border border-dark-700 rounded-lg focus:outline-none focus:border-dark-500 transition-colors"
            required
          />
          <button
            type="submit"
            className="w-full bg-accent-blue text-white hover:brightness-110 py-4 rounded-lg transition-all tracking-wide font-medium"
          >
            Connect
          </button>
        </form>

        <div className="text-center">
          <a
            href="https://ai.google.dev/gemini-api/docs/api-key"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-dark-500 hover:text-dark-300 transition-colors"
          >
            Get your API key
          </a>
        </div>
      </div>
    </div>
  );
};
