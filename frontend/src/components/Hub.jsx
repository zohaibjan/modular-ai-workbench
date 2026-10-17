import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Building2, Zap, ArrowRight,
  Brain, FileText, BarChart3, Heart, Plane,
  Sparkles,
} from 'lucide-react';

const ICONS = { Users, Building2, Brain, FileText, BarChart3, Heart, Plane };

/* ── Floating wireframe figure ────────────────────────────────────────── */
function WireframeBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute right-0 top-0 h-full w-1/2 overflow-hidden"
    >
      <img
        src="/images/mark.svg"
        alt=""
        className="absolute right-[-8%] top-[-5%] h-[110%] w-auto object-contain opacity-[0.07]"
        style={{ filter: 'saturate(2) brightness(0.6)' }}
      />
    </div>
  );
}

/* ── App card ─────────────────────────────────────────────────────────── */
function AppCard({ app, index }) {
  const Icon = ICONS[app.icon] || Brain;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 + index * 0.07 }}
    >
      <Link
        to={`/${app.id}`}
        className="group relative flex flex-col gap-4 rounded-2xl bg-white border border-slate-200 p-6 h-full
                   shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
      >
        {/* Subtle brand gradient line at top */}
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: app.color || 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
        />

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: app.color || 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <Icon size={22} className="text-white" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-base mb-1.5 group-hover:text-blue-600 transition-colors">
            {app.name}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {app.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-mono">v{app.version || '1.0.0'}</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold
                           group-hover:bg-blue-600 group-hover:text-white transition-colors">
            Open App
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function Hub() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps')
      .then((r) => r.json())
      .then((data) => { setApps(data.apps || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">

      {/* Dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none" aria-hidden />

      {/* Wireframe figure — right side decorative */}
      <WireframeBg />

      {/* Very subtle top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, hsl(221 83% 53% / 0.04) 0%, transparent 100%)',
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">

            {/* Brand badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200
                         shadow-sm text-sm text-slate-600 font-medium mb-8"
            >
              <img
                src="/images/mark.svg"
                alt="Beyond Human"
                className="w-6 h-6 rounded-md object-cover"
                onError={(e) => { e.currentTarget.style.display='none'; }}
              />
              Beyond Human — AI App Development
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              <span className="shimmer-text">AI-Powered</span>
              <br />
              <span className="text-slate-900">Hub Platform</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="max-w-lg mx-auto lg:mx-0 text-lg text-slate-500 leading-relaxed mb-8"
            >
              A suite of intelligent tools built to supercharge your team.
              Select an app below to get started.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50
                         border border-blue-100 text-blue-700 text-sm font-medium"
            >
              <Zap size={13} className="text-blue-500" />
              {apps.length} app{apps.length !== 1 ? 's' : ''} available
            </motion.div>
          </div>

          {/* Right — brand logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-[-12px] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-xl" />
              <img
                src="/images/mark.svg"
                alt="Beyond Human"
                className="relative w-48 h-48 rounded-3xl object-cover shadow-xl border border-white/80"
                onError={(e) => {
                  e.currentTarget.parentElement.innerHTML =
                    '<div class="w-48 h-48 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl"><span class="text-white text-5xl font-bold">BH</span></div>';
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Beyond Human</p>
              <p className="text-xs text-slate-400">AI App Development</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-6 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* ── App Grid ─────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 py-10 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-2 mb-8"
        >
          <Sparkles size={16} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Your Applications
          </h2>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Brain size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 mb-1">No apps available yet.</p>
            <p className="text-sm text-slate-400">
              Add apps to the <code className="font-mono text-blue-600">apps/</code> directory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
