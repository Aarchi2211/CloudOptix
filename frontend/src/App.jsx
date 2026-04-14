import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CloudUsage from "./pages/CloudUsage";
import CostLeak from "./pages/CostLeak";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

import { clearAuthData, getStoredAuth, getHomeRoute } from './utils/auth';

function App() {
  const [authState, setAuthState] = useState(() => getStoredAuth());

  const isLoggedIn = Boolean(authState.token);
  const currentUser = authState.user;

  const handleLoginSuccess = (data) => {
    setAuthState(data);
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthState({ token: '', user: null });
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {isLoggedIn && <Header onLogout={handleLogout} user={currentUser} />}

        <div className="app-main">
          <Routes>
            {/* 🔥 DEFAULT ROUTE */}
            <Route
              path="/"
              element={
                isLoggedIn
                  ? <Navigate to={getHomeRoute(currentUser)} replace />
                  : <Navigate to="/login" replace />
              }
            />

            {/* LOGIN */}
            <Route
              path="/login"
              element={
                isLoggedIn
                  ? <Navigate to={getHomeRoute(currentUser)} replace />
                  : <Login onLoginSuccess={handleLoginSuccess} />
              }
            />

            {/* REGISTER */}
            <Route
              path="/register"
              element={
                isLoggedIn
                  ? <Navigate to={getHomeRoute(currentUser)} replace />
                  : <Register />
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cloud-usage" element={<CloudUsage />} />
              <Route path="/cost-leaks" element={<CostLeak />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
          </Routes>
        </div>

        {isLoggedIn && <Footer />}
      </div>
    </BrowserRouter>
  );
}

export default App;