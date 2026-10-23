import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CloudRain,
  ChevronDown,
  CheckCircle2,
  Sliders,
  Layers,
  Radio,
  Eye,
  Search,
  Filter,
  Waves,
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

  const handleSelectWard = (wardProps) => {
    setSelectedWard(wardProps);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300 font-inter selection:bg-[var(--brand)] selection:text-white">

      {/* Global Fixed Navbar */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: 3D MOTION EARTH OBSERVATORY
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] sm:min-h-screen w-full flex flex-col justify-between pt-24 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden select-none bg-black">

        {/* 3D Motion Earth Video — Crystal Clear, Bright & Unobstructed */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center scale-[1.02]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          />
          {/* Gentle Directional Shadow for Text Contrast — Rotating Earth on the right stays 100% luminous */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
          {/* Left Column: Authoritative Editorial & Breathable Composition */}
          <div className="lg:col-span-8 space-y-6 text-left max-w-xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE · 250 WARDS</span>
            </div>

            {/* Authoritative Headline */}
            <h1 className="font-instrument text-white text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] leading-[0.95] tracking-tight text-glow">
              Know the risk.
              <br />
              <span className="italic font-light text-cyan-200">
                Before the water rises.
              </span>
            </h1>

            {/* Concise One-Sentence Punchline */}
            <p className="text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-lg">
              Real-time municipal flood monitoring, explainable risk intelligence, and emergency dispatch across all 250 wards of Delhi.
            </p>

            {/* Fluid Rounded Pill Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/dashboard"
                className="btn-primary py-3.5 px-7 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-full shadow-lg shadow-[var(--brand)]/25 no-underline transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Explore Live Intelligence</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/report"
                className="btn-secondary py-3.5 px-6 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Report an Incident</span>
              </Link>
            </div>

            {/* Verification Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-white/70 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostGIS Polygon Containment</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Crash Offline Resilient</span>
              </span>
            </div>
          </div>

          {/* Right Column: Kept completely open so the 3D rotating Earth is 100% visible */}
          <div className="lg:col-span-4 hidden lg:block pointer-events-none" />
        </div>

        {/* Lower Hero Bar: Geolocation & Telemetry Status */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/15 text-xs text-white/70 font-mono">
          <span className="tracking-wider uppercase">28.6139° N · 77.2090° E · DELHI NCT</span>
          <span className="text-[11px] text-white/50 tracking-wider hidden sm:inline">250 MUNICIPAL WARDS MONITORED</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING ROUNDED METRICS CARD (COMPACT & SLEEK)
          ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="surface-card py-4 sm:py-5 px-5 sm:px-7 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-lg grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-[var(--brand)]" />
              <span>Coverage</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
              {totalWardsCount}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Wards Monitored</div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Alert Wards</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {(counts.critical || 0) + (counts.high || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Requiring Pump Staging</div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              <CloudRain className="w-3 h-3 text-cyan-500" />
              <span>Precipitation</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)] flex items-baseline justify-center gap-1 tracking-tight">
              {currentRainfall}
              <span className="text-xs font-normal text-[var(--text-muted)]">mm/h</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Live Telemetry Feed</div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span>City Risk Index</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400 flex items-baseline justify-center gap-1 tracking-tight">
              {avgRiskScore}
              <span className="text-xs font-normal text-[var(--text-muted)]">/100</span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Deterministic City Mean</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE GEOSPATIAL MAP (#city-map)
          ───────────────────────────────────────────────────────────── */}
      <section id="city-map" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider mb-2">
                01 · Geospatial Intelligence
              </span>
              <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
                Delhi, mapped in real time.
              </h2>
            </div>

            {/* Quick Search & Zone Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search ward or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono w-52 placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-1 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-full p-1">
                <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] ml-2 mr-1" />
                {availableZones.slice(0, 5).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors ${
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

          {/* Interactive Map & Telemetry HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Container */}
            <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-[var(--border)] shadow-lg relative bg-[var(--surface)] min-h-[520px]">
              {loading ? (
                <div className="h-[520px] flex items-center justify-center font-mono text-xs text-[var(--text-muted)] space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                  <span>Loading Delhi Geospatial Boundaries…</span>
                </div>
              ) : (
                <WardMap
                  wardsData={wardsGeoJSON}
                  selectedWardId={selectedWard?.ward_code || selectedWard?.id}
                  onSelectWard={handleSelectWard}
                  height="520px"
                />
              )}
            </div>

            {/* Selected Ward Inspection Card */}
            <div className="lg:col-span-4 surface-card p-6 rounded-2xl border border-[var(--border)] space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] tracking-tight">
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
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)] font-sans">Composite Risk</span>
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
                <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Drainage Deficit (40%)</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {100 - (selectedWard?.drainageCapacity ?? 68)}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Rainfall Forecast (35%)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {currentRainfall} mm/h
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
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
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
              <span className="block text-2xl font-bold">{counts.critical || 12}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Critical Wards</span>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400">
              <span className="block text-2xl font-bold">{counts.high || 38}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">High Wards</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
              <span className="block text-2xl font-bold">{counts.moderate || 110}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Moderate Wards</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <span className="block text-2xl font-bold">{counts.low || 90}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Low Wards</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DETERMINISTIC MASS-BALANCE ENGINE
          ───────────────────────────────────────────────────────────── */}
      <section id="risk-engine" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider mb-2">
                02 · Deterministic Engine
              </span>
              <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
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

          {/* 3 Physical Weights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-card p-6 rounded-2xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[var(--brand)]">40%</span>
                <Layers className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[var(--text-primary)] tracking-tight">
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
              <h3 className="text-lg font-bold font-serif text-[var(--text-primary)] tracking-tight">
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
              <h3 className="text-lg font-bold font-serif text-[var(--text-primary)] tracking-tight">
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
          5. CLOSING STATEMENT CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--bg)] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[var(--brand-strong)] to-[var(--brand-deep)] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--brand)]/20">
            <Waves className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              When the rain changes,
              <br />
              <span className="italic text-[var(--brand)]">PRAVAH changes with it.</span>
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-[var(--text-secondary)] font-normal">
              Unified command for municipal engineers, disaster response officers, and citizens across the National Capital Territory.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="btn-primary py-3.5 px-8 text-sm font-semibold flex items-center gap-2 rounded-full shadow-lg shadow-[var(--brand)]/25 no-underline transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Enter City Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/incidents"
              className="btn-secondary py-3.5 px-6 text-sm font-medium rounded-full no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Emergency Dispatch Center</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}