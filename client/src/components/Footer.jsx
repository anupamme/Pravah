import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, PhoneCall, Shield } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          {/* Left Side: Copyright */}
          <div className="text-[11px] text-[var(--text-muted)] text-center sm:text-left">
            © 2026 Suhani Yadav · Delhi Flood Intelligence Platform (MCD & DDMA)
          </div>

          {/* Right Side: Admin Portal + 24/7 Hotlines + Rightmost Back to Top Button */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 font-mono text-xs">
            {/* Admin beside hotlines */}
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--brand)] text-[11px] font-sans font-medium transition-colors no-underline"
            >
              <Shield size={12} className="text-[var(--brand)]" />
              <span>Admin</span>
            </Link>

            {/* 24/7 Hotlines */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
                <PhoneCall size={11} className="text-amber-500" />
                <span className="hidden sm:inline">24/7 Hotlines:</span>
                <span className="sm:hidden">24/7:</span>
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

            {/* Back to Top (Rightmost, Icon Only, Zero Wasted Space) */}
            <button
              onClick={scrollToTop}
              className="w-7 h-7 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] hover:border-[var(--brand)]/50 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-all flex items-center justify-center cursor-pointer group ml-1 shrink-0"
              aria-label="Back to top"
              title="Back to top"
            >
              <ArrowUp size={13} strokeWidth={2.25} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
