import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { EntitlementProvider } from "./context/EntitlementContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EntitlementProvider>
          <App />
        </EntitlementProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
