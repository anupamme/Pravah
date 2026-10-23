import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Shield,
  Activity,
  ArrowUp,
  Database,
  FileCheck,
  PhoneCall,
  Cpu,
  Layers,
  Radio,
  CheckCircle2,
  LifeBuoy
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Municipal Mandate (Spans 4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <Link to="/" className="inline-block text-decoration-none group select-none" aria-label="Pravah Home">
                <span className="font-limelight text-2xl tracking-wider text-[var(--text-primary)] uppercase group-hover:text-[var(--brand)] transition-colors">
                  PRAVAH
                </span>
              </Link>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--brand)]">
                v2.4 NCT Live
              </span>
            </div>

            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-mono">
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
          </div>

          {/* Operational Intelligence (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
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

          {/* Civic Services & Emergency Hotlines (Spans 3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <PhoneCall size={13} className="text-amber-500" />
              <span>Civic Hotlines (24/7)</span>
            </h3>
            
            <div className="space-y-2">
              <Link
                to="/report"
                className="w-full py-2 px-3 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand)] flex items-center justify-between transition-colors no-underline"
              >
                <span className="flex items-center gap-1.5">
                  <LifeBuoy size={13} className="text-cyan-500" />
                  <span>Report Waterlogging</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--brand)] font-semibold">GPS GeoTag</span>
              </Link>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 text-xs">
                <a
                  href="tel:1916"
                  className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline group"
                >
                  <span className="text-[11px]">MCD Flood Control Room</span>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline">1916</span>
                </a>
                <a
                  href="tel:1077"
                  className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline group"
                >
                  <span className="text-[11px]">DDMA Disaster Relief</span>
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:underline">1077</span>
                </a>
                <a
                  href="tel:112"
                  className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline group"
                >
                  <span className="text-[11px]">National Emergency</span>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline">112</span>
                </a>
                <a
                  href="tel:01122479526"
                  className="flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline group"
                >
                  <span className="text-[11px]">East/Yamuna Control</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] group-hover:underline">011-22479526</span>
                </a>
              </div>
            </div>
          </div>

          {/* Architecture & Engineering Standards (Spans 3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
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
        <div className="mt-10 pt-5 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
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
