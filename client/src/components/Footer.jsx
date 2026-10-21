import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Lock,
  Activity,
  ArrowUp,
  Server,
  FileText,
  PhoneCall,
  MapPin
} from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300 select-none">
      
      {/* 1. Pre-Footer: Administrative Command Strip */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)]">
              Delhi Hydrological Telemetry Grid · Operational
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[var(--text-muted)] hidden lg:inline font-mono">
              PostGIS SRID 4326 · Deterministic Mass-Balance Engine
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium transition-colors border-0 no-underline shadow-sm"
            >
              <Lock size={12} strokeWidth={1.5} />
              <span>Admin Console</span>
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          
          {/* Brand & Municipal Overview (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block text-decoration-none" aria-label="Pravah Home">
              <span className="font-limelight text-2xl tracking-wider text-[var(--text-primary)] uppercase">
                PRAVAH
              </span>
            </Link>
            <p className="text-xs sm:text-[13px] text-[var(--text-muted)] max-w-sm leading-relaxed">
              Unified command for municipal engineers, disaster response officers, and citizens across the National Capital Territory of Delhi. Continuous waterlogging risk monitoring, explainable multi-horizon projections, and real-time civic dispatch.
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                <Activity size={12} strokeWidth={1.5} className="text-cyan-400" />
                <span>250 Municipal Wards & 14 Critical Underpasses</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                <MapPin size={12} strokeWidth={1.5} className="text-emerald-400" />
                <span>Delhi Disaster Management Authority (DDMA) & MCD</span>
              </div>
            </div>
          </div>

          {/* Intelligence Platforms */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono">
              Intelligence
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  City Overview
                </Link>
              </li>
              <li>
                <Link to="/incidents" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Incident Command
                </Link>
              </li>
              <li>
                <Link to="/simulator" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Scenario Simulator
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Historical Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Operations */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono">
              Civic Operations
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/report" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Report Waterlogging
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Underpass Hotspot Index
                </Link>
              </li>
              <li>
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <PhoneCall size={11} strokeWidth={1.5} className="text-amber-400" />
                  <span>MCD Control: 1800-11-2345</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Governance & Architecture */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono">
              Governance
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/admin" className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors no-underline block">
                  Admin Console
                </Link>
              </li>
              <li>
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Server size={11} strokeWidth={1.5} className="text-sky-400" />
                  <span>PostgreSQL 16 + PostGIS</span>
                </span>
              </li>
              <li>
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <FileText size={11} strokeWidth={1.5} className="text-emerald-400" />
                  <span>Mass-Balance Audited</span>
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Bottom Geo & Copyright Strip */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <div>
            © {new Date().getFullYear()} Municipal Corporation of Delhi (MCD) · Urban Flood Intelligence.
          </div>
          
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px]">
              28.6139° N · 77.2090° E · NCT Delhi
            </span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors bg-transparent border-0 cursor-pointer p-0"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={11} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
