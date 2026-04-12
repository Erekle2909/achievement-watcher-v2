import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";

export type Page = "dashboard" | "library" | "stats" | "settings";

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "library":
        return <Library />;
      case "stats":
        return <Stats />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
