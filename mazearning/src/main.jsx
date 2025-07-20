// mazearning/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global CSS Reset / Base Styles
import "./index.css";

// Root mounting node
const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
