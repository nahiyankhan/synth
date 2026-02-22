import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { DesignLanguageProvider } from "./context/DesignLanguageContext";
import { ToolUIProvider } from "./context/ToolUIContext";
import { ToolCallProvider } from "./context/ToolCallContext";
import { ChatProvider } from "./context/ChatContext";
import { useApiKey } from "./hooks/useApiKey";
import { useInitialization } from "./hooks/useInitialization";
import { GlobalChat } from "./components/GlobalChat";

// Eager load - needed immediately
import { ApiKeyPage } from "./pages/ApiKeyPage";
import { LandingPage } from "./pages/LandingPage";

// Lazy load - code split
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const EditorPage = lazy(() => import("./pages/EditorPage").then(m => ({ default: m.EditorPage })));
const GenerationPage = lazy(() => import("./pages/GenerationPage").then(m => ({ default: m.GenerationPage })));
const ColorsPage = lazy(() => import("./pages/ColorsPage").then(m => ({ default: m.ColorsPage })));
const TypographyPage = lazy(() => import("./pages/TypographyPage").then(m => ({ default: m.TypographyPage })));
const SizesPage = lazy(() => import("./pages/SizesPage").then(m => ({ default: m.SizesPage })));
const ComponentsPage = lazy(() => import("./pages/ComponentsPage").then(m => ({ default: m.ComponentsPage })));
const ContentPage = lazy(() => import("./pages/ContentPage").then(m => ({ default: m.ContentPage })));
const PagesViewPage = lazy(() => import("./pages/PagesViewPage").then(m => ({ default: m.PagesViewPage })));
const SplitPage = lazy(() => import("./pages/SplitPage").then(m => ({ default: m.SplitPage })));
const BrandStrategyPage = lazy(() => import("./pages/BrandStrategyPage").then(m => ({ default: m.BrandStrategyPage })));
const PlaygroundPage = lazy(() => import("./pages/PlaygroundPage").then(m => ({ default: m.PlaygroundPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const AISignalDemo = lazy(() => import("./pages/AISignalDemo").then(m => ({ default: m.AISignalDemo })));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-neutral-950">
    <div className="animate-pulse text-neutral-500">Loading...</div>
  </div>
);

const AppRoutes: React.FC = () => {
  const { hasApiKey } = useApiKey();

  useInitialization();
  // Note: useDesignLanguageLoader moved to EditorPage only

  if (!hasApiKey) {
    return <ApiKeyPage />;
  }

  return (
    <ChatProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
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
