import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'City Overview', path: '/dashboard' },
    { label: 'Incidents', path: '/incidents' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Admin Portal', path: '/admin' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        scrolled
          ? 'bg-[var(--surface-glass-strong)] backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
          : 'bg-[var(--surface-glass)] backdrop-blur-md border-b border-[var(--border)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Brand Wordmark with Custom Limelight Font */}
          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group select-none">
            <span className="font-limelight text-xl sm:text-2xl tracking-wider text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors uppercase">
              PRAVAH
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">
              V2
            </span>
          </Link>

          {/* Center: Balanced, Clean Navigation Titles */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`text-[13px] font-medium tracking-normal py-1.5 px-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-[var(--brand)] font-semibold bg-sky-500/10'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Theme Toggle & Report Action */}
          <div className="flex items-center gap-3">
            {/* Sun/Moon Theme Toggle */}
            <ThemeToggle />

            {/* Report Incident Minimal Pill */}
            <Link
              to="/report"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors no-underline shadow-sm"
            >
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Report</span>
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors border border-[var(--border)] bg-[var(--surface)]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-in Drawer */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-y-0 right-0 w-[80%] max-w-[300px] bg-[var(--surface-glass-strong)] backdrop-blur-2xl border-l border-[var(--border)] p-6 flex flex-col justify-between shadow-2xl z-50 transition-transform duration-200"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <span className="font-limelight text-xl tracking-wider text-[var(--text-primary)] uppercase">
                  PRAVAH
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5">
                {navItems.map((item, idx) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={idx}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-2.5 px-3.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                        isActive
                          ? 'text-[var(--brand)] font-semibold bg-sky-500/10'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[var(--text-muted)] font-medium">Appearance</span>
                <ThemeToggle />
              </div>
              <Link
                to="/report"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-full btn-primary text-xs font-semibold flex items-center justify-center gap-2 no-underline"
              >
                <ShieldAlert size={14} />
                <span>Report Incident</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
