
import { useState } from "react";

import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MissionPlanner from "./pages/MissionPlanner.jsx";
import RoutePlanner from "./pages/RoutePlanner.jsx";
import TerrainAI from "./pages/TerrainAI.jsx";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "mission":
        return <MissionPlanner />;

      case "routes":
        return <RoutePlanner />;

      case "terrain-ai":
        return <TerrainAI />;

      case "dashboard":
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100">
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {renderPage()}
      </main>

      <footer className="border-t border-white/5 px-6 py-5 text-center text-xs text-slate-500">
        MARSWALK © 2026 · Mars Terrain Intelligence & Rover Mission Planning
      </footer>
    </div>
  );
}

export default App;
