// src/App.jsx

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ColorModeProvider } from "./contexts/ColorModeContext";
import MainAppLayout from "./routes/MainAppLayout.jsx"; // All routes handled here

function App() {
  return (
    <ColorModeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            {/* 💡 Main layout with all routes */}
            <MainAppLayout />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ColorModeProvider>
  );
}

export default App;
