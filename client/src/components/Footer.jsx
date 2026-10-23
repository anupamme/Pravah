import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* Main Footer Row: Quick Navigation Links & Emergency Hotlines */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          
          {/* Quick Clean Navigation */}
          <nav className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 font-medium text-[var(--text-secondary)]">
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
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
              <PhoneCall size={11} className="text-amber-500" />
              <span>24/7 Hotlines:</span>
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
              National <strong className="text-sky-600 dark:text-sky-400 font-bold ml-1">112</strong>
            </a>
          </div>

        </div>

        {/* Centered Copyright */}
        <div className="pt-3 border-t border-[var(--border)] text-center text-[11px] text-[var(--text-muted)]">
          © 2026 Suhani Yadav · Delhi Flood Intelligence Platform (MCD & DDMA)
        </div>

      </div>
    </footer>
  );
}
