import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { GameDetail } from "./pages/GameDetail";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";

export type Page = "dashboard" | "library" | "game-detail" | "stats" | "settings";

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    setCurrentPage("game-detail");
  };

  const handleBackToLibrary = () => {
    setCurrentPage("library");
    setSelectedGameId(null);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== "game-detail") {
      setSelectedGameId(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "library":
        return <Library onGameSelect={handleGameSelect} />;
      case "game-detail":
        return selectedGameId ? (
          <GameDetail gameId={selectedGameId} onBack={handleBackToLibrary} />
        ) : (
          <Library onGameSelect={handleGameSelect} />
        );
      case "stats":
        return <Stats />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}
