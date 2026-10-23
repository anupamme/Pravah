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
  MapPin,
  Cpu,
  Layers
} from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300">
      
      {/* 1. Pre-Footer: Real-time Telemetry & Admin Command Strip */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Delhi Hydrological Telemetry Grid · Operational
            </span>
            <span className="hidden md:inline text-[var(--text-muted)] text-[11px] font-mono">
              (Latency &lt; 42ms)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="text-[11px] text-[var(--text-muted)] hidden lg:inline font-mono">
              PostGIS SRID 4326 · Mass-Balance Physics Model
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-medium transition-all border border-sky-500/20 hover:border-sky-500/40 no-underline shadow-sm"
            >
              <Shield size={12} strokeWidth={1.5} />
              <span>Admin Console</span>
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          
          {/* Brand & Municipal Overview (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <Link to="/" className="inline-block text-decoration-none group" aria-label="Pravah Home">
                <span className="font-limelight text-2xl tracking-wider text-[var(--text-primary)] uppercase group-hover:text-[var(--brand)] transition-colors">
                  PRAVAH
                </span>
              </Link>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-[var(--surface)] border border-[var(--border)] text-[var(--brand)]">
                v2.4 NCT Live
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-[var(--text-muted)] max-w-sm leading-relaxed">
              Unified real-time flood intelligence and decision support platform for municipal engineers, disaster management authorities, and citizens across the National Capital Territory of Delhi.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                <Activity size={12} strokeWidth={1.5} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>250 Municipal Wards & 14 Critical Underpass Nodes</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                <MapPin size={12} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Delhi Disaster Management Authority (DDMA) & MCD</span>
              </div>
            </div>
          </div>

          {/* Intelligence Systems */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <Layers size={13} className="text-[var(--brand)]" />
              <span>Intelligence</span>
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  City Risk Overview
                </Link>
              </li>
              <li>
                <Link to="/incidents" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Incident Command
                </Link>
              </li>
              <li>
                <Link to="/simulator" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Scenario Simulator
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Historical Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Operations & Helplines */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <PhoneCall size={13} className="text-amber-500" />
              <span>Civic Services</span>
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/report" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Report Waterlogging
                </Link>
              </li>
              <li>
                <a
                  href="tel:1916"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors no-underline flex items-center justify-between group"
                >
                  <span>MCD Control Room</span>
                  <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">1916</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:1077"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors no-underline flex items-center justify-between group"
                >
                  <span>DDMA Disaster Helpline</span>
                  <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 group-hover:underline">1077</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:112"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors no-underline flex items-center justify-between group"
                >
                  <span>Unified Emergency</span>
                  <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 group-hover:underline">112</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture & Governance */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <Cpu size={13} className="text-purple-500" />
              <span>Architecture</span>
            </h3>
            <ul className="space-y-2.5 text-xs list-none p-0 m-0">
              <li>
                <Link to="/admin" className="text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors no-underline block">
                  Municipal Admin Portal
                </Link>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <Database size={11} strokeWidth={1.5} className="text-sky-600 dark:text-sky-400 shrink-0" />
                <span>PostgreSQL 16 + PostGIS</span>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <FileCheck size={11} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Mass-Balance Audited</span>
              </li>
              <li className="text-[var(--text-muted)] flex items-center gap-1.5 text-[11px]">
                <Activity size={11} strokeWidth={1.5} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Open-Meteo High-Res Radar</span>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Bottom Geo & Copyright Strip */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} Municipal Corporation of Delhi (MCD) & DDMA · Delhi Flood Intelligence Platform.
          </div>
          
          <div className="flex items-center gap-5 sm:gap-6">
            <span className="font-mono text-[10px] hidden sm:inline text-[var(--text-muted)]">
              28.6139° N · 77.2090° E · NCT Delhi
            </span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-all shadow-xs cursor-pointer"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={12} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
