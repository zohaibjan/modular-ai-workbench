import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutGrid, ChevronRight, LogOut, ShieldCheck, User } from 'lucide-react';

/* ── Brand logo — falls back to initials if image missing ─────────────── */
function BrandLogo({ size = 'md' }) {
  const [err, setErr] = useState(false);
  const cls = size === 'sm'
    ? 'w-7 h-7 rounded-lg'
    : 'w-8 h-8 rounded-lg';

  if (!err) {
    return (
      <img
        src="/images/mark.svg"
        alt="Modular AI Workbench"
        onError={() => setErr(true)}
        className={`${cls} object-cover shadow-sm border border-white/20`}
      />
    );
  }
  return (
    <div className={`${cls} bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm`}>
      <LayoutGrid size={14} className="text-white" />
    </div>
  );
}

export { BrandLogo };

const APP_LABELS = { example: 'Example App' };

function Header({ user, onLogout }) {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const currentApp = segments.length > 0 && APP_LABELS[segments[0]] ? segments[0] : null;
  const isAdmin = pathname === '/admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Left — logo + breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <BrandLogo />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-slate-900 leading-none">Modular AI Workbench</span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 hidden sm:block">Hub Platform</span>
            </div>
          </Link>

          {(currentApp || isAdmin) && (
            <>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
              <span className="text-sm text-slate-600 font-medium truncate">
                {isAdmin ? 'Admin' : APP_LABELS[currentApp]}
              </span>
            </>
          )}
        </div>

        {/* Right — navigation */}
        <nav className="flex items-center gap-1">
          {currentApp && (
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500
                         hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              All Apps
            </Link>
          )}

          {user?.role === 'admin' && !isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* User chip */}
          {user?.username && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 ml-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                             flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                {user.username}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
