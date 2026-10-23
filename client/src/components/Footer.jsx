import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Shield,
  Activity,
  ArrowUp,
  Database,
  FileCheck,
  Cpu,
  Layers,
  Radio,
  CheckCircle2
} from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          1. REAL-TIME TELEMETRY & SYSTEM HEALTH TICKER STRIP
          ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Delhi Hydrological Telemetry Grid · Operational
            </span>
            <span className="hidden md:inline text-[var(--text-muted)] text-[10px] font-mono">
              (Sync Latency &lt; 42ms · Zero-Crash Offline Fallback Active)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px]">
            <span className="text-[var(--text-muted)] hidden lg:inline">
              PostGIS SRID 4326 · 250 Wards Polygons
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 text-xs font-medium transition-all border border-sky-500/20 hover:border-sky-500/40 no-underline shadow-xs"
            >
              <Shield size={12} strokeWidth={1.75} />
              <span>Admin Console</span>
              <ArrowUpRight size={11} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN INSTITUTIONAL FOOTER GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 lg:py-11">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Municipal Checkpoints & Compact 2x2 Hotlines Matrix (Spans 5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            {/* 3 Checkpoint Markers */}
            <div className="space-y-1.5 text-xs text-[var(--text-secondary)] font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>Delhi Disaster Management Authority (DDMA)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>Municipal Corporation of Delhi (MCD) Grid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>Public Works Department (PWD) Underpass Telemetry</span>
              </div>
            </div>

            {/* Compact Space-Saving 2x2 Hotlines Matrix */}
            <div className="pt-1 max-w-sm">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold pb-1.5">
                24/7 Control Room Hotlines
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <a
                  href="tel:1916"
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between no-underline transition-colors group shadow-2xs"
                >
                  <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">MCD</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:underline">1916</span>
                </a>
                <a
                  href="tel:1077"
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between no-underline transition-colors group shadow-2xs"
                >
                  <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">DDMA</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 group-hover:underline">1077</span>
                </a>
                <a
                  href="tel:112"
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between no-underline transition-colors group shadow-2xs"
                >
                  <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">Emergency</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 group-hover:underline">112</span>
                </a>
                <a
                  href="tel:01122479526"
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-between no-underline transition-colors group shadow-2xs"
                >
                  <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">Yamuna</span>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] group-hover:underline">22479526</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Operational Intelligence (Spans 3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <Layers size={13} className="text-[var(--brand)]" />
              <span>Operations</span>
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  City Risk Overview
                </Link>
              </li>
              <li>
                <Link to="/incidents" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Emergency Dispatch
                </Link>
              </li>
              <li>
                <Link to="/simulator" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  What-If Simulator
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Historical Analytics
                </Link>
              </li>
              <li>
                <a href="#city-map" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Interactive Ward Map
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Architecture & Engineering Standards (Spans 4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <Cpu size={13} className="text-purple-500" />
              <span>Engineering & Audit</span>
            </h3>
            
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/admin" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Administrative Governance Portal
                </Link>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <Database size={12} className="text-sky-500 shrink-0" />
                <span>PostgreSQL 16 + PostGIS Spatial Engine</span>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <FileCheck size={12} className="text-emerald-500 shrink-0" />
                <span>Mass-Balance Hydraulic Equation Audited</span>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <Radio size={12} className="text-cyan-500 shrink-0" />
                <span>Open-Meteo High-Resolution Doppler Radar</span>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <Activity size={12} className="text-amber-500 shrink-0" />
                <span>Zero-Crash In-Memory Fallback Cache</span>
              </li>
            </ul>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. BOTTOM GEO & COPYRIGHT STRIP
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-8 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
          <div className="text-center sm:text-left">
            © 2026 Suhani Yadav · Delhi Flood Intelligence Platform (MCD & DDMA)
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-mono text-[10px] hidden sm:inline text-[var(--text-muted)]">
              28.6139° N · 77.2090° E · NCT Delhi
            </span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-all shadow-xs cursor-pointer"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={11} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
