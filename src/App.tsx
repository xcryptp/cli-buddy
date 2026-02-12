import { useState } from "react";
import { useScreenshots } from "./hooks/useScreenshots";
import { StatusBar } from "./components/StatusBar";
import { UpdateBanner } from "./components/UpdateBanner";
import { GalleryView } from "./components/Gallery/GalleryView";
import { ImagePreview } from "./components/Gallery/ImagePreview";
import { SettingsPanel } from "./components/SettingsPanel";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useScreenshots();

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg-primary)]">
      <UpdateBanner />
      <StatusBar onSettingsClick={() => setSettingsOpen(true)} />
      <GalleryView />
      <ImagePreview />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
