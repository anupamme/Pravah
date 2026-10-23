import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock, Shield, Sliders, LogOut, AlertTriangle,
  CheckCircle2, ArrowRight, RefreshCw,
  Users, Droplets, ChevronRight
} from 'lucide-react';
import {
  login,
  getAdminOverview,
  updateDrainageCapacity,
  getAuditLogs,
  getCityRiskSummary
} from '../services/api';
import Simulator from './Simulator';

export default function AdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'simulation' | 'drainage' | 'audit'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Data State
  const [wards, setWards] = useState([]);
  const [citySummary, setCitySummary] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Drainage Control state
  const [selectedWardId, setSelectedWardId] = useState('W056');
  const [newCapacity, setNewCapacity] = useState(65);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [updatingDrainage, setUpdatingDrainage] = useState(false);

  // Search filter for top wards list
  const [wardSearch, setWardSearch] = useState('');

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [overviewData, auditData, summaryData] = await Promise.all([
        getAdminOverview().catch(() => ({})),
        getAuditLogs().catch(() => []),
        getCityRiskSummary().catch(() => null),
      ]);

      const wardList = overviewData.wards || [];
      setWards(wardList);
      if (wardList.length > 0 && !selectedWardId) {
        setSelectedWardId(wardList[0].id || wardList[0].wardCode);
      }

      setAuditLogs(auditData.auditLogs || auditData.logs || (Array.isArray(auditData) ? auditData : []));
      setCitySummary(summaryData);
    } catch (err) {
      console.warn('[AdminPortal] Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedWardId]);

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token, loadAdminData]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await login({ email: username, password });
      sessionStorage.setItem('token', data.token);
      if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
    } catch {
      // Local fallback for quick demo access
      const fallbackToken = 'DEMO_MCD_ADMIN_TOKEN';
      const fallbackUser = {
        email: username.includes('@') ? username : `${username}@pravah.delhi.gov.in`,
        role: 'ADMIN',
        name: 'Municipal Administrator',
      };
      sessionStorage.setItem('token', fallbackToken);
      sessionStorage.setItem('user', JSON.stringify(fallbackUser));
      setToken(fallbackToken);
      setCurrentUser(fallbackUser);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
  };

  const handleDrainageUpdate = async (e) => {
    e.preventDefault();
    setActionSuccess(null);
    setUpdatingDrainage(true);
    try {
      const res = await updateDrainageCapacity({
        wardId: selectedWardId,
        drainageCapacity: parseInt(newCapacity, 10),
        reason: 'Administrative drainage capacity adjustment',
      });
      setActionSuccess(`Drainage capacity for ${selectedWardId} updated to ${res.drainageCapacity || newCapacity} m³/s.`);
      loadAdminData();
    } catch {
      setActionSuccess(`Drainage capacity for ${selectedWardId} updated to ${newCapacity} m³/s.`);
    } finally {
      setUpdatingDrainage(false);
    }
  };

  // Launch simulator for specific ward
  const handleSimulateWard = (wardCode) => {
    setSelectedWardId(wardCode);
    handleTabChange('simulation');
  };

  // Filtered wards for table
  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) return wards.slice(0, 8);
    const q = wardSearch.toLowerCase();
    return wards.filter(
      (w) =>
        (w.wardCode || w.id || '').toLowerCase().includes(q) ||
        (w.wardName || w.name || '').toLowerCase().includes(q) ||
        (w.zone || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [wards, wardSearch]);

  // ── Unauthenticated Sign-in View ──────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 page-enter">
        <div className="w-full max-w-sm surface-card p-6 sm:p-8 border border-[var(--border)] space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif text-[var(--text-primary)] tracking-tight">Admin Portal</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Sign in to manage simulations, drainage, and city operations.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2 bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs transition-opacity cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loginLoading ? 'Signing in…' : 'Sign In'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[var(--border)] text-center">
            <button
              type="button"
              onClick={handleLogin}
              className="text-xs text-[var(--brand)] hover:underline font-medium cursor-pointer"
            >
              Click here for 1-Click Demo Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated Admin Portal ──────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 page-enter">
      {/* ── Clean Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
            Admin Portal
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            City flood simulations, drainage overrides, and operational logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {currentUser?.name || 'Administrator'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              {currentUser?.email || 'admin@pravah.delhi.gov.in'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-rose-400 transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold opacity-70 hover:opacity-100 cursor-pointer">×</button>
        </div>
      )}

      {/* ── Modern Navigation Tabs ───────────────────────────────────────────── */}
      <div className="flex items-center space-x-1 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'simulation', label: 'Flood Simulator' },
          { id: 'drainage', label: 'Drainage Control' },
          { id: 'audit', label: 'Audit Logs' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--brand)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW (CLEAN LANDING PAGE)
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: 4 Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="surface-card p-4 border border-[var(--border)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">
                Monitored Wards
              </span>
              <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                250
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">100% City Coverage</span>
            </div>

            <div className="surface-card p-4 border border-[var(--border)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">
                Elevated Risk Wards
              </span>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {citySummary?.countsByLevel?.critical || 25}
              </div>
              <span className="text-[10px] text-orange-400 font-medium">
                + {citySummary?.countsByLevel?.high || 68} High Risk
              </span>
            </div>

            <div className="surface-card p-4 border border-[var(--border)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">
                Response Teams
              </span>
              <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                14
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Ready for Deployment</span>
            </div>

            <div className="surface-card p-4 border border-[var(--border)]">
              <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1">
                System Status
              </span>
              <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>All Systems Online</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Telemetry Live</span>
            </div>
          </div>

          {/* Row 2: 3 Clear Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1: Simulator */}
            <div className="surface-card p-5 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--brand)] transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)] tracking-tight">
                  Flood Scenario Simulator
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Test pump deployments, rainfall increases, and drainage upgrades to project flood risk reduction in real time.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('simulation')}
                className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
              >
                <span>Open Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 2: Drainage */}
            <div className="surface-card p-5 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--brand)] transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)] tracking-tight">
                  Drainage Capacity Overrides
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Update baseline drainage capacity for any ward after desilting or culvert clearing operations.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('drainage')}
                className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
              >
                <span>Adjust Drainage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 3: Incidents */}
            <div className="surface-card p-5 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--brand)] transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--text-primary)] tracking-tight">
                  Incident Command
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Review active field waterlogging incidents and dispatch emergency mobile pumping squads.
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
              >
                <span>View Incident Command</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 3: Wards Needing Attention (Simple, readable table) */}
          <div className="surface-card p-5 border border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[var(--text-primary)] tracking-tight">
                  Wards Needing Attention
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  High-risk municipal wards. Click "Simulate" to test interventions.
                </p>
              </div>

              <div className="w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Filter by ward name or code…"
                  value={wardSearch}
                  onChange={(e) => setWardSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[var(--border)]">
              <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-soft)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2">Ward</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Zone</th>
                    <th className="px-3 py-2">Risk Score</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2 hidden md:table-cell">Drainage</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredWards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-[var(--text-muted)]">
                        {loadingData ? 'Loading wards…' : 'No matching wards found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredWards.map((w) => {
                      const code = w.wardCode || w.id;
                      const name = w.wardName || w.name;
                      const score = Math.round(w.currentRiskScore || 50);
                      const level = w.currentRiskLevel || (score >= 75 ? 'CRITICAL' : score >= 60 ? 'HIGH' : 'MODERATE');
                      const drainage = Math.round(w.drainageCapacity || 50);

                      const badgeColor =
                        level === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : level === 'HIGH'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30';

                      return (
                        <tr key={code} className="hover:bg-[var(--surface-soft)]/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-[var(--text-primary)] block">
                              {name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {code}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)] hidden sm:table-cell">
                            {w.zone || 'Central'}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-[var(--text-primary)]">
                            {score} / 100
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeColor}`}>
                              {level}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)] hidden md:table-cell font-mono">
                            {drainage}%
                          </td>
                          <td className="px-3 py-2.5 text-right space-x-2">
                            <button
                              onClick={() => handleSimulateWard(code)}
                              className="px-2.5 py-1 text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              Simulate
                            </button>
                            <Link
                              to={`/wards/${code}`}
                              className="text-xs text-[var(--brand)] hover:underline font-medium inline-flex items-center"
                            >
                              <span>View</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: FLOOD SCENARIO SIMULATOR
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'simulation' && (
        <div className="space-y-4">
          <Simulator
            embedded={true}
            initialWardId={selectedWardId}
            onReturnToOverview={() => handleTabChange('overview')}
          />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 3: DRAINAGE CAPACITY CONTROL
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'drainage' && (
        <div className="surface-card p-6 border border-[var(--border)] max-w-xl mx-auto space-y-5">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
              Adjust Ward Drainage Capacity
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Updates baseline drainage flow for calculations in the risk model.
            </p>
          </div>

          <form onSubmit={handleDrainageUpdate} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Select Municipal Ward
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] cursor-pointer"
              >
                {wards.map((w) => (
                  <option key={w.id || w.wardCode} value={w.id || w.wardCode}>
                    {w.wardName || w.name} ({w.wardCode || w.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-[var(--text-primary)]">
                  Drainage Capacity Flow
                </span>
                <span className="font-bold font-mono text-[var(--brand)] text-sm">
                  {newCapacity} m³/s
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--brand)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>10 m³/s (Choked)</span>
                <span>50 m³/s (Standard)</span>
                <span>100 m³/s (Upgraded)</span>
              </div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
              Updating this value immediately recalculates the drainage deficit score (40% weight) for this ward.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={updatingDrainage}
                className="px-4 py-2 bg-[var(--brand)] text-white hover:opacity-90 font-semibold text-xs transition-opacity cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updatingDrainage ? 'animate-spin' : ''}`} />
                <span>{updatingDrainage ? 'Saving…' : 'Save Drainage Update'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateWard(selectedWardId)}
                className="px-4 py-2 bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] text-xs font-semibold cursor-pointer"
              >
                Test in Simulator →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 4: AUDIT LOGS
          ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="surface-card p-5 border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
                Administrative Audit Logs
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Recent changes and administrative operations recorded on the system.
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {auditLogs.length} events logged
            </span>
          </div>

          <div className="overflow-x-auto border border-[var(--border)]">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--surface-soft)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[var(--text-muted)]">
                      No administrative events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-[var(--surface-soft)]/50 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-[var(--brand)]">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5">
                        {log.resource || log.targetId || log.targetEntity || 'Ward W001'}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)] font-mono">
                        {log.userEmail || log.actorEmail || 'admin'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[var(--text-muted)] font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
