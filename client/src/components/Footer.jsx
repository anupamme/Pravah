import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, PhoneCall, Shield } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-9 space-y-6">
        
        {/* Main Footer Row: Brand & Civic Attribution (Left) + Quick Links (Center) + Hotlines (Right) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
          
          {/* Brand & Mandate */}
          <div className="space-y-1">
            <Link to="/" className="inline-block text-decoration-none group select-none" aria-label="Pravah Home">
              <span className="font-limelight text-2xl tracking-wider text-[var(--text-primary)] uppercase group-hover:text-[var(--brand)] transition-colors">
                PRAVAH
              </span>
            </Link>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Delhi Municipal Flood Intelligence · DDMA & MCD
            </div>
          </div>

          {/* Quick Clean Navigation */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--text-secondary)]">
            <Link to="/dashboard" className="hover:text-[var(--brand)] transition-colors no-underline">
              City Overview
            </Link>
            <Link to="/incidents" className="hover:text-[var(--brand)] transition-colors no-underline">
              Incidents
            </Link>
            <Link to="/simulator" className="hover:text-[var(--brand)] transition-colors no-underline">
              Simulator
            </Link>
            <Link to="/analytics" className="hover:text-[var(--brand)] transition-colors no-underline">
              Analytics
            </Link>
            <Link to="/admin" className="hover:text-[var(--brand)] transition-colors no-underline flex items-center gap-1">
              <Shield size={12} />
              <span>Admin</span>
            </Link>
          </nav>

          {/* Compact Hotlines Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
              <PhoneCall size={11} className="text-amber-500" />
              <span>24/7:</span>
            </span>
            <a
              href="tel:1916"
              className="px-2.5 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] text-[11px] no-underline transition-colors"
            >
              MCD <strong className="text-amber-600 dark:text-amber-400 font-bold ml-1">1916</strong>
            </a>
            <a
              href="tel:1077"
              className="px-2.5 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] text-[11px] no-underline transition-colors"
            >
              DDMA <strong className="text-rose-600 dark:text-rose-400 font-bold ml-1">1077</strong>
            </a>
            <a
              href="tel:112"
              className="px-2.5 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] text-[11px] no-underline transition-colors"
            >
              <strong className="text-sky-600 dark:text-sky-400 font-bold">112</strong>
            </a>
          </div>

        </div>

        {/* Bottom Copyright & Coordinates Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
          <div>
            © 2026 Suhani Yadav · Delhi Flood Intelligence Platform (MCD & DDMA)
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-mono text-[10px] hidden sm:inline">
              28.6139° N · 77.2090° E · NCT Delhi
            </span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-all cursor-pointer"
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
