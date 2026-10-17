import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hub from './components/Hub';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import { checkAuth, logout } from './utils/auth';

/* ── Lazy-load each app's root component ─────────────────────────────────── */

const ExampleApp = lazy(() => import('@apps/example/frontend/App.jsx'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-600">Loading…</span>
      </div>
    </div>
  );
}

function App() {
  // null = checking, false = not logged in, object = user info
  const [user, setUser] = useState(null);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(false);
  }, []);

  // Verify session on mount — /api/auth/verify returns user info if valid
  useEffect(() => {
    checkAuth().then((result) => setUser(result || false));
  }, []);

  // Listen for 401s from axios interceptors anywhere in the app
  useEffect(() => {
    const onForceLogout = () => setUser(false);
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, []);

  // Still verifying
  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={(info) => setUser(info)} />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header user={user} onLogout={handleLogout} />

        <main className="flex-1">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Hub />} />
              <Route path="/example/*" element={<ExampleApp />} />
              <Route
                path="/admin"
                element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
              />
            </Routes>
          </Suspense>
        </main>

        <footer className="border-t border-slate-200 py-5 bg-white/60">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src="/images/mark.svg"
                alt=""
                className="w-5 h-5 rounded object-cover opacity-60"
                onError={(e) => { e.currentTarget.style.display='none'; }}
              />
              <span className="text-xs text-slate-400 font-medium">Beyond Human — Hub Platform</span>
            </div>
            <span className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} &nbsp;&mdash;&nbsp; AI-assisted tools. Always verify with a qualified professional.
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
