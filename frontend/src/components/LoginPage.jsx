import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onLogin({ username: data.username, role: data.role, allowed_apps: data.allowed_apps });
      } else {
        setError(data.detail || 'Invalid username or password.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center
                      bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">

        {/* Background wireframe */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/mark.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-contain opacity-[0.18]"
            style={{ filter: 'saturate(1.5) brightness(1.2)' }}
          />
        </div>

        {/* Subtle radial gradient over wireframe */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(2,8,23,0.5) 100%)',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10 text-center px-10">
          <img
            src="/images/mark.svg"
            alt="Modular AI Workbench"
            className="w-28 h-28 rounded-3xl object-cover mx-auto mb-6 shadow-2xl border-2 border-white/10"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Modular AI Workbench</h1>
          <p className="text-blue-300 text-sm font-medium mb-8">AI App Development</p>

          <div className="space-y-3 text-left max-w-xs mx-auto">
            {[
              'AI-powered professional tools',
              'Secure, private & on-premise AI',
              'Built for productivity at scale',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <p className="absolute bottom-6 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Modular AI Workbench — Hub Platform
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img
              src="/images/mark.svg"
              alt="Modular AI Workbench"
              className="w-10 h-10 rounded-xl object-cover shadow"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <p className="font-bold text-slate-900 text-sm">Modular AI Workbench</p>
              <p className="text-xs text-slate-400">Hub Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to access your apps</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                             text-slate-900 text-sm placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500
                             transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50
                             text-slate-900 text-sm placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500
                             transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold
                         hover:from-blue-700 hover:to-indigo-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all shadow-sm shadow-blue-200 hover:shadow-blue-300"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
