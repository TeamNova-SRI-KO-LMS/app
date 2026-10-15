import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthProvider from './context/AuthProvider';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SocketProvider } from './context/SocketProvider';
import { NotificationProvider } from './context/NotificationContext';
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AdminAuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </NotificationProvider>
          </SocketProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);