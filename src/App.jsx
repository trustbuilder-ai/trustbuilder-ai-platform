import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import ConsoleLayout from "./layouts/ConsoleLayout";
import WargamesLayout from "./layouts/WargamesLayout";
import Home from "./pages/Home";
import WargamesDashboard from "./pages/Wargames";
import Models from "./pages/Models";
import RedTeaming from "./pages/RedTeaming";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import ChallengeDebug from "./pages/ChallengeDebug";
import WargamesChallenge from "./pages/wargames/WargamesChallenge";
import Callback from "./pages/auth/Callback";
import { setupApiClient } from "./lib/api-client";
import "./App.css";

function App() {
  // Initialize API client with authentication on app load
  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <div className="app">
      <Routes>
        {/* Routes with Header */}
        <Route element={<RootLayout />}>
          {/* Redirect from root to dashboard */}
          <Route path="/" element={<Navigate to="/wargames/challenge" replace />} />
          
          {/* Console routes with sidebar */}
          <Route path="/console" element={<ConsoleLayout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="wargames-dashboard" element={<WargamesDashboard />} />
            <Route path="models" element={<Models />} />
            <Route path="redteaming" element={<RedTeaming />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="challenge-debug" element={<ChallengeDebug />} />
          </Route>
          
          {/* Auth routes without sidebar */}
          <Route path="/auth/callback" element={<Callback />} />
        </Route>
        
        {/* Wargames routes without Header */}
        { <Route path="/wargames" element={<WargamesLayout />}>
          <Route path="challenge" element={<WargamesChallenge />} />
          <Route path="challenge/:challengeId" element={<WargamesChallenge />} />
        </Route> }
      </Routes>
    </div>
  );
}

export default App;
