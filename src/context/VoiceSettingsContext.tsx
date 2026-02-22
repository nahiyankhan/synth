import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Aoede';
export type VoiceTone = 'professional' | 'friendly' | 'concise';

interface VoiceSettings {
  voiceName: VoiceName;
  tone: VoiceTone;
}

interface VoiceSettingsContextType {
  voiceSettings: VoiceSettings;
  updateVoiceName: (name: VoiceName) => void;
  updateTone: (tone: VoiceTone) => void;
}

const defaultSettings: VoiceSettings = {
  voiceName: 'Kore',
  tone: 'professional',
};

const VoiceSettingsContext = createContext<VoiceSettingsContextType | undefined>(undefined);

export const VoiceSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem('voice_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const updateVoiceName = (name: VoiceName) => {
    setVoiceSettings((prev) => ({ ...prev, voiceName: name }));
  };

  const updateTone = (tone: VoiceTone) => {
    setVoiceSettings((prev) => ({ ...prev, tone }));
  };

  return (
    <VoiceSettingsContext.Provider
      value={{
        voiceSettings,
        updateVoiceName,
        updateTone,
      }}
    >
      {children}
    </VoiceSettingsContext.Provider>
  );
};

export const useVoiceSettings = () => {
  const context = useContext(VoiceSettingsContext);
  if (!context) {
    throw new Error('useVoiceSettings must be used within VoiceSettingsProvider');
  }
  return context;
};

