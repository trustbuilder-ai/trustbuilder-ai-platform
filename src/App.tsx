import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import ConsoleLayout from "./features/console/layouts/ConsoleLayout";
import WargamesLayout from "./features/wargames/layouts/WargamesLayout";
import { 
  ScrollyTellLayout, 
  ScrollyTellView, 
  ChatView, 
  TreeView 
} from "./features/scrollytell";
import Home from "./pages/Home";
import WargamesDashboard from "./features/console/pages/WargamesDashboard";
import Models from "./features/console/pages/Models";
import RedTeaming from "./features/console/pages/RedTeaming";
import Dashboard from "./features/console/pages/Dashboard";
import Tournaments from "./features/console/pages/Tournaments";
import ChallengeDebug from "./features/console/pages/ChallengeDebug";
import WargamesChallenge from "./features/wargames/pages/WargamesChallenge";
import Callback from "./shared/components/auth/Callback";
import { setupApiClient } from "./shared/lib/api-client";
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
        
        {/* ScrollyTell routes */}
        <Route path="/scrollytell" element={<ScrollyTellLayout />}>
          <Route index element={<ScrollyTellView />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="tree" element={<TreeView />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
