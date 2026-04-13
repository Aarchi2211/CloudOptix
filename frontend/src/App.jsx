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
import { clearAuthData, getHomeRoute, getStoredAuth } from './utils/auth';

function App() {
  const [authState, setAuthState] = useState(() => getStoredAuth());
  const isLoggedIn = Boolean(authState.token);
  const currentUser = authState.user;

  const handleLoginSuccess = (nextAuthState) => {
    setAuthState(nextAuthState);
  };

  const handleLogout = () => {
    clearAuthData();
    setAuthState({ token: '', user: null });
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {isLoggedIn && <Header onLogout={handleLogout} user={currentUser} />}

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to={isLoggedIn ? getHomeRoute(currentUser) : '/login'} replace />} />

            <Route
              path="/login"
              element={
                isLoggedIn ? <Navigate to={getHomeRoute(currentUser)} replace /> : <Login onLoginSuccess={handleLoginSuccess} />
              }
            />

            <Route
              path="/register"
              element={
                isLoggedIn ? (
                  <Navigate to={getHomeRoute(currentUser)} replace />
                ) : (
                  <Register onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            <Route
              path="/cloud-usage"
              element={
                <ProtectedRoute>
                  <CloudUsage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cost-leaks"
              element={
                <ProtectedRoute>
                  <CostLeak />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
          </Routes>
        </main>

        {isLoggedIn && <Footer />}
      </div>
    </BrowserRouter>
  );
}

export default App;
