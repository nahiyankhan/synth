import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { DesignLanguageProvider } from "./context/DesignLanguageContext";
import { ToolUIProvider } from "./context/ToolUIContext";
import { ToolCallProvider } from "./context/ToolCallContext";
import { ChatProvider } from "./context/ChatContext";
import { useApiKey } from "./hooks/useApiKey";
import { useInitialization } from "./hooks/useInitialization";
import { GlobalChat } from "./components/GlobalChat";
import { ApiKeyPage } from "./pages/ApiKeyPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LandingPage } from "./pages/LandingPage";
import { EditorPage } from "./pages/EditorPage";
import { GenerationPage } from "./pages/GenerationPage";
import { ColorsPage } from "./pages/ColorsPage";
import { TypographyPage } from "./pages/TypographyPage";
import { SizesPage } from "./pages/SizesPage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { ContentPage } from "./pages/ContentPage";
import { PagesViewPage } from "./pages/PagesViewPage";
import { SplitPage } from "./pages/SplitPage";
import { BrandStrategyPage } from "./pages/BrandStrategyPage";
import { PlaygroundPage } from "./pages/PlaygroundPage";
import { LoginPage } from "./pages/LoginPage";
import { AISignalDemo } from "./pages/AISignalDemo";

const AppRoutes: React.FC = () => {
  const { hasApiKey } = useApiKey();

  useInitialization();
  // Note: useDesignLanguageLoader moved to EditorPage only

  if (!hasApiKey) {
    return <ApiKeyPage />;
  }

  return (
    <ChatProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/create" element={<GenerationPage />} />
        <Route path="/editor/visual-direction" element={<BrandStrategyPage />} />
        <Route path="/editor/colors" element={<ColorsPage />} />
        <Route path="/editor/typography" element={<TypographyPage />} />
        <Route path="/editor/sizes" element={<SizesPage />} />
        <Route path="/editor/components" element={<ComponentsPage />} />
        <Route path="/editor/content" element={<ContentPage />} />
        <Route path="/editor/pages" element={<PagesViewPage />} />
        <Route path="/editor/split" element={<SplitPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/demo/ai-signal" element={<AISignalDemo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalChat />
    </ChatProvider>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <DesignLanguageProvider>
          <ToolUIProvider>
            <ToolCallProvider>
              <AppRoutes />
            </ToolCallProvider>
          </ToolUIProvider>
        </DesignLanguageProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
