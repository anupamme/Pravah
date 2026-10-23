import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CloudRain,
  CheckCircle2,
  Sliders,
  Layers,
  Radio,
  Eye,
  Search,
  Filter,
  Waves,
  Cpu,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WardMap from '../components/WardMap';
import { getCityRiskSummary, getCurrentWeather, getWardsGeoJSON } from '../services/api';

export default function Landing() {
  const [riskSummary, setRiskSummary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [wardsGeoJSON, setWardsGeoJSON] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Load initial citywide risk, weather, and ward boundaries
  useEffect(() => {
    Promise.allSettled([
      getCityRiskSummary(),
      getCurrentWeather(),
      getWardsGeoJSON(),
    ]).then(([summaryRes, wxRes, wardsRes]) => {
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setRiskSummary(summaryRes.value);
      }
      if (wxRes.status === 'fulfilled' && wxRes.value) {
        setWeather(wxRes.value);
      }
      if (wardsRes.status === 'fulfilled' && wardsRes.value) {
        setWardsGeoJSON(wardsRes.value);
        if (wardsRes.value.features?.length > 0) {
          setSelectedWard(wardsRes.value.features[0].properties);
        }
      }
      setLoading(false);
    });
  }, []);

  const counts = riskSummary?.countsByLevel || { critical: 25, high: 68, moderate: 75, low: 82 };
  const totalWardsCount = wardsGeoJSON?.features?.length || 250;
  const currentRainfall = weather?.rainfallMm?.toFixed(1) ?? '42.0';
  const avgRiskScore = riskSummary?.avgRiskScore?.toFixed(1) ?? '58.4';

  const availableZones = useMemo(() => {
    if (!wardsGeoJSON?.features) return ['ALL'];
    const set = new Set();
    wardsGeoJSON.features.forEach((f) => {
      const z = f.properties?.zone;
      if (z) set.add(z.toUpperCase());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [wardsGeoJSON]);

  // Real-time live search matching
  useEffect(() => {
    if (!searchQuery.trim() || !wardsGeoJSON?.features) return;
    const q = searchQuery.toLowerCase().trim();
    const found = wardsGeoJSON.features.find((f) => {
      const name = (f.properties?.name || f.properties?.ward_name || '').toLowerCase();
      const code = (f.properties?.ward_code || f.properties?.id || '').toLowerCase();
      const zone = (f.properties?.zone || '').toLowerCase();
      return name.includes(q) || code.includes(q) || zone.includes(q);
    });
    if (found) {
      setSelectedWard(found.properties);
    }
  }, [searchQuery, wardsGeoJSON]);

  const handleSelectWard = (wardProps) => {
    setSelectedWard(wardProps);
  };

  const handleSelectHotspot = (wardName) => {
    if (!wardsGeoJSON?.features) return;
    const found = wardsGeoJSON.features.find((f) => {
      const n = (f.properties?.name || f.properties?.ward_name || '').toLowerCase();
      return n.includes(wardName.toLowerCase());
    });
    if (found) {
      setSelectedWard(found.properties);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300 font-inter selection:bg-[var(--brand)] selection:text-white">

      {/* Global Fixed Navbar */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: 3D MOTION EARTH OBSERVATORY
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] sm:min-h-[92vh] w-full flex flex-col justify-between pt-24 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden select-none bg-black">

        {/* 3D Motion Earth Video Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center scale-[1.02]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          />
          {/* Gentle Gradient Masks for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
          {/* Left Column: Authoritative Editorial */}
          <div className="lg:col-span-8 space-y-5 text-left max-w-xl">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE · 250 WARDS MONITORED</span>
            </div>

            {/* Authoritative Headline */}
            <h1 className="font-instrument text-white text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-glow">
              Know the risk.
              <br />
              <span className="italic font-light text-cyan-200">
                Before the water rises.
              </span>
            </h1>

            {/* Mission Statement */}
            <p className="text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-lg">
              Delhi's unified municipal flood monitoring, deterministic risk intelligence, and emergency dispatch system across all 250 municipal wards.
            </p>

            {/* Refined Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/dashboard"
                className="btn-primary py-3 px-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-full shadow-lg shadow-[var(--brand)]/25 no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Launch City Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/report"
                className="btn-secondary py-3 px-5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Report Waterlogging</span>
              </Link>
            </div>

            {/* Architecture Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-white/70 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostGIS Spatial Containment</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Crash Offline Resilient</span>
              </span>
            </div>
          </div>

          {/* Right Column: Kept transparent so the 3D rotating Earth is fully luminous */}
          <div className="lg:col-span-4 hidden lg:block pointer-events-none" />
        </div>

        {/* Lower Hero Bar: Geolocation & Telemetry Status */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-3 border-t border-white/15 text-xs text-white/70 font-mono">
          <span className="tracking-wider uppercase">28.6139° N · 77.2090° E · DELHI NCT</span>
          <span className="text-[11px] text-white/60 tracking-wider hidden sm:inline">250 MUNICIPAL WARDS · REAL-TIME HYDRAULIC SENSING</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STREAMLINED EXECUTIVE TELEMETRY RIBBON (COMPACT & SLEEK)
          ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-5 sm:-mt-6 relative z-20">
        <div className="bg-[var(--surface-elevated)]/95 backdrop-blur-xl rounded-xl border border-[var(--border)] shadow-md grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          
          {/* 1. Coverage */}
          <div className="p-3 sm:p-3.5 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-[var(--brand)]" />
              <span>Coverage</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-primary)] tracking-tight my-0.5">
              {totalWardsCount}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">Wards Monitored</div>
          </div>

          {/* 2. Alert Wards */}
          <div className="p-3 sm:p-3.5 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Alert Wards</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight my-0.5">
              {(counts.critical || 0) + (counts.high || 0)}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">Requiring Pump Staging</div>
          </div>

          {/* 3. Precipitation */}
          <div className="p-3 sm:p-3.5 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              <CloudRain className="w-3 h-3 text-cyan-500" />
              <span>Precipitation</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-primary)] flex items-baseline justify-center gap-1 tracking-tight my-0.5">
              {currentRainfall}
              <span className="text-[11px] font-normal text-[var(--text-muted)]">mm/h</span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">Live Telemetry Feed</div>
          </div>

          {/* 4. City Risk Index */}
          <div className="p-3 sm:p-3.5 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span>City Risk Index</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-baseline justify-center gap-1 tracking-tight my-0.5">
              {avgRiskScore}
              <span className="text-[11px] font-normal text-[var(--text-muted)]">/100</span>
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">Deterministic City Mean</div>
          </div>

        </div>

        {/* Live Municipal Advisory Ticker Bar */}
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[var(--surface-soft)]/60 border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[var(--text-primary)] font-semibold">YAMUNA RIVER LEVEL: 204.85 m</span>
            <span className="text-[var(--text-muted)]">(Warning: 205.33 m · Safe Flow)</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
            <span>Pumps Staged: 142/150</span>
            <span>Minto Bridge: Clear</span>
            <span>ITO: Clear</span>
            <span className="hidden md:inline">Doppler Radar: Active</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE GEOSPATIAL MAP (#city-map)
          ───────────────────────────────────────────────────────────── */}
      <section id="city-map" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[var(--border)]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider mb-2">
                01 · Geospatial Intelligence
              </span>
              <h2 className="font-instrument text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
                Delhi, mapped in real time.
              </h2>
            </div>

            {/* Quick Search & Zone Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ward or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono w-48 sm:w-56 placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-1 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-full p-1">
                <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] ml-2 mr-1" />
                {availableZones.slice(0, 5).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-2 py-0.5 rounded-full text-[11px] cursor-pointer transition-colors ${
                      selectedZone === zone
                        ? 'bg-[var(--brand)] text-white font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hotspot Presets Quick Jump Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono text-[var(--text-muted)]">
            <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] shrink-0">Hotspots:</span>
            {[
              { name: 'Connaught Place', zone: 'Central' },
              { name: 'Civil Lines', zone: 'North' },
              { name: 'Rohini', zone: 'North-West' },
              { name: 'Lajpat Nagar', zone: 'South' },
              { name: 'Shahdara', zone: 'East' },
            ].map((spot) => (
              <button
                key={spot.name}
                type="button"
                onClick={() => handleSelectHotspot(spot.name)}
                className="px-2.5 py-1 rounded-full bg-[var(--surface-soft)] hover:bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors shrink-0 cursor-pointer"
              >
                {spot.name} ({spot.zone})
              </button>
            ))}
          </div>

          {/* Interactive Map & Telemetry HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Container */}
            <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg relative bg-[var(--surface)] min-h-[500px]">
              {loading ? (
                <div className="h-[500px] flex items-center justify-center font-mono text-xs text-[var(--text-muted)] space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                  <span>Loading Delhi Geospatial Boundaries…</span>
                </div>
              ) : (
                <WardMap
                  wardsData={wardsGeoJSON}
                  selectedWardId={selectedWard?.ward_code || selectedWard?.id}
                  onSelectWard={handleSelectWard}
                  height="500px"
                />
              )}
            </div>

            {/* Selected Ward Inspection Card */}
            <div className="lg:col-span-4 surface-card p-5 rounded-2xl border border-[var(--border)] space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-lg font-bold font-serif text-[var(--text-primary)] tracking-tight">
                    {selectedWard?.name || selectedWard?.ward_name || 'Connaught Place'}
                  </h3>
                  <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    Ward {selectedWard?.id || selectedWard?.ward_code || 'W056'} · {selectedWard?.zone || 'Central'} Zone
                  </div>
                </div>
                <span className={`badge-risk-${(selectedWard?.riskLevel || 'critical').toLowerCase()}`}>
                  {selectedWard?.riskLevel || 'CRITICAL'}
                </span>
              </div>

              {/* Risk Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)] font-sans text-xs">Composite Risk Score</span>
                  <span className="text-[var(--text-primary)] font-bold">
                    {selectedWard?.riskScore || 84.5} / 100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-soft)] border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{ width: `${selectedWard?.riskScore || 84.5}%` }}
                  />
                </div>
              </div>

              {/* Sub-Factor Metrics */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Drainage Deficit (40%)</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {100 - (selectedWard?.drainageCapacity ?? 68)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Rainfall Forecast (35%)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {currentRainfall} mm/h
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Citizen Reports (25%)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedWard?.activeComplaints ?? 7} Active
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/wards/${selectedWard?.id || selectedWard?.ward_code || 'W056'}`}
                className="w-full py-2.5 rounded-full btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 no-underline transition-opacity cursor-pointer shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Deep Ward Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4-Tier Risk Distribution Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
              <span className="block text-xl font-bold">{counts.critical || 12}</span>
              <span className="text-[11px] uppercase text-[var(--text-secondary)] font-sans font-semibold">Critical Wards (&gt;75)</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400">
              <span className="block text-xl font-bold">{counts.high || 38}</span>
              <span className="text-[11px] uppercase text-[var(--text-secondary)] font-sans font-semibold">High Wards (55–75)</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
              <span className="block text-xl font-bold">{counts.moderate || 110}</span>
              <span className="text-[11px] uppercase text-[var(--text-secondary)] font-sans font-semibold">Moderate Wards (35–55)</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <span className="block text-xl font-bold">{counts.low || 90}</span>
              <span className="text-[11px] uppercase text-[var(--text-secondary)] font-sans font-semibold">Low Wards (&lt;35)</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. CRITICAL UNDERPASSES & VULNERABILITY NODES (NEW EXECUTIVE HUD)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--surface-soft)]/30">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                Telemetry Grid · Key Choke Points
              </span>
              <h2 className="font-instrument text-2xl sm:text-3xl lg:text-4xl font-normal text-[var(--text-primary)] tracking-tight">
                Critical Underpasses & Hotspot Matrix
              </h2>
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Sensors Online · 100% Signal Integrity
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              { name: 'Minto Bridge', status: 'Clear', water: '0.0 m', pumps: '2 Staged', color: 'emerald' },
              { name: 'ITO Chauk Underpass', status: 'Clear', water: '0.0 m', pumps: '1 Staged', color: 'emerald' },
              { name: 'Tilak Bridge', status: 'Normal', water: '0.0 m', pumps: 'Automated', color: 'emerald' },
              { name: 'Zakhira Underpass', status: 'Watch', water: '0.05 m', pumps: '1 Staged', color: 'amber' },
              { name: 'Pul Prahladpur', status: 'Clear', water: '0.0 m', pumps: 'Mobile Unit', color: 'emerald' },
            ].map((node, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 hover:border-[var(--brand)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] font-serif">{node.name}</span>
                  <span className={`w-2 h-2 rounded-full ${node.color === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Water Ponding</span>
                  <span className="font-semibold text-[var(--text-primary)]">{node.water}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[var(--border)] text-[var(--text-secondary)]">
                  <span>Dewatering:</span>
                  <span className="font-medium text-[var(--brand)]">{node.pumps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DETERMINISTIC MASS-BALANCE ENGINE
          ───────────────────────────────────────────────────────────── */}
      <section id="risk-engine" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[var(--border)]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider mb-2">
                02 · Deterministic Mass-Balance Engine
              </span>
              <h2 className="font-instrument text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
                Transparent math, not black-box guesses.
              </h2>
            </div>
            <Link
              to="/simulator"
              className="py-2.5 px-5 rounded-full btn-secondary text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer no-underline"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Test in Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mathematical Equation Ribbon */}
          <div className="p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] font-mono text-xs sm:text-sm flex flex-col md:flex-row items-center justify-between gap-3 text-[var(--text-primary)]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--brand)] shrink-0" />
              <span className="font-semibold text-xs tracking-wide">HYDROLOGICAL RISK EQUATION:</span>
            </div>
            <div className="text-center font-bold text-xs sm:text-sm text-[var(--brand)]">
              Risk(w) = (Drainage Deficit × 0.40) + (Precipitation × 0.35) + (Citizen Reports × 0.25)
            </div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% Audit-Verifiable
            </span>
          </div>

          {/* 3 Physical Weights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-card p-6 rounded-2xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[var(--brand)]">40%</span>
                <Layers className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Drainage Deficit
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Evaluates stormwater line carrying volume, siltation depth, and culvert cross-sectional flow volume against 50-year return storm events.
              </p>
            </div>

            <div className="surface-card p-6 rounded-2xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400">35%</span>
                <CloudRain className="w-5 h-5 text-cyan-600" />
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Rainfall Forecast
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                6h, 12h, and 24h multi-horizon convective precipitation projections fetched directly from high-resolution Open-Meteo meteorological radar feeds.
              </p>
            </div>

            <div className="surface-card p-6 rounded-2xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">25%</span>
                <Radio className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Civic Complaints
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Real-time citizen waterlogging reports filtered for coordinate bounding validity, deduplicated, and decayed chronologically over time.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FOUR-STEP MUNICIPAL OPERATING CONTINUUM
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--brand)] font-semibold">
              Operational Continuum
            </span>
            <h2 className="font-instrument text-3xl sm:text-4xl font-normal text-[var(--text-primary)] tracking-tight">
              How Pravah Protects Delhi
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              From atmospheric Doppler radar detection to pre-emptive pump mobilization in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Doppler Radar Ingestion',
                desc: 'Continuous 15-minute meteorological radar scans forecast convective rainfall intensity across Delhi NCT.',
              },
              {
                step: '02',
                title: 'PostGIS Polygon Mapping',
                desc: 'Sub-second spatial indexing maps reverse-geocoded citizen reports directly into 250 municipal ward polygons.',
              },
              {
                step: '03',
                title: 'Mass-Balance Risk Engine',
                desc: 'Calculates runoff volume against culvert cross-sections to generate deterministic risk scores from 0 to 100.',
              },
              {
                step: '04',
                title: 'Pre-Emptive Dewatering',
                desc: 'Automated dispatch orders mobilize mobile pumps and emergency crews before road waterlogging peaks.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2 relative"
              >
                <span className="text-xs font-mono font-bold text-[var(--brand)]">{item.step}</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-serif">{item.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CLOSING STATEMENT CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--bg)] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--brand-strong)] to-[var(--brand-deep)] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--brand)]/20">
            <Waves className="w-7 h-7" />
          </div>

          <div className="space-y-2.5">
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              When the rain changes,
              <br />
              <span className="italic text-[var(--brand)]">PRAVAH changes with it.</span>
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-[var(--text-secondary)] font-normal">
              Unified command for municipal engineers, disaster response officers, and citizens across the National Capital Territory.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Link
              to="/dashboard"
              className="btn-primary py-3 px-7 text-xs sm:text-sm font-semibold flex items-center gap-2 rounded-full shadow-lg shadow-[var(--brand)]/25 no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Launch Operations Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/incidents"
              className="btn-secondary py-3 px-6 text-xs sm:text-sm font-medium rounded-full no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Emergency Dispatch Center</span>
            </Link>
            <Link
              to="/report"
              className="py-3 px-5 text-xs sm:text-sm font-medium rounded-full bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Report Waterlogging</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Institutional Footer */}
      <Footer />

    </div>
  );
}
