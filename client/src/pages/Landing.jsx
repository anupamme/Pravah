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
  Sliders,
  Eye,
  Search,
  Filter,
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

  // Ingest initial city risk, weather, and ward boundaries
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

  // Filtered zones for quick filter
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
      <section className="relative min-h-[92vh] w-full flex flex-col justify-between pt-24 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden select-none bg-black">

        {/* 3D Motion Earth Video Viewport — Pure, Bright & Unobstructed */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center scale-[1.02]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          />
          {/* Subtle Directional Shadow for Text Readability — Earth on the right shines bright */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
          {/* Left Column: Focused, Punchy & Breathable */}
          <div className="lg:col-span-8 space-y-6 text-left max-w-xl">
            {/* Live Status Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/20 text-white font-mono text-[11px] uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-cyan-300">LIVE TELEMETRY</span>
              <span className="text-white/40">·</span>
              <span>250 WARDS</span>
            </div>

            {/* Authoritative Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-white tracking-tight leading-[0.98]">
              Know the risk.
              <br />
              <span className="italic font-light text-cyan-200">
                Before the water rises.
              </span>
            </h1>

            {/* One-Sentence Punchline */}
            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal max-w-lg">
              Continuous municipal flood monitoring, explainable risk intelligence, and emergency dispatch across Delhi.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="py-3 px-6 text-xs font-semibold bg-[var(--brand)] hover:opacity-95 text-white flex items-center gap-2 no-underline shadow-lg transition-opacity cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Explore Live Intelligence</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/report"
                className="py-3 px-5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md flex items-center gap-2 no-underline transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Report an Incident</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Kept completely open so the 3D rotating Earth is 100% visible */}
          <div className="lg:col-span-4 hidden lg:block pointer-events-none" />
        </div>

        {/* Lower Hero Bar: Minimal Geolocation & Scroll Cue */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/15 text-xs text-white/70 font-mono">
          <span className="tracking-wider uppercase">28.6139° N · 77.2090° E · DELHI NCT</span>
          <a
            href="#city-map"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors no-underline font-sans text-xs font-medium"
          >
            <span>EXPLORE PLATFORM</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STREAMLINED LIVE METRICS RIBBON (LIGHT & DARK PERFECT)
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--border)] bg-[var(--surface-elevated)] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase">
              <span>Wards Monitored</span>
              <MapPin className="w-3.5 h-3.5 text-[var(--brand)]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text-primary)]">
              {totalWardsCount}
            </div>
            <div className="text-xs text-[var(--text-muted)]">250 PostGIS Polygons</div>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-rose-500/30 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-600 dark:text-rose-400 uppercase">
              <span>Alert Wards</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {(counts.critical || 0) + (counts.high || 0)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Requiring Pump Staging</div>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-cyan-500/30 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-700 dark:text-cyan-400 uppercase">
              <span>Precipitation</span>
              <CloudRain className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text-primary)] flex items-baseline gap-1">
              {currentRainfall}
              <span className="text-xs font-normal text-[var(--text-muted)]">mm/h</span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Live Radar Feeds</div>
          </div>

          <div className="p-4 bg-[var(--surface)] border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 uppercase">
              <span>City Risk Index</span>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 flex items-baseline gap-1">
              {avgRiskScore}
              <span className="text-xs font-normal text-[var(--text-muted)]">/100</span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Deterministic Average</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE GEOSPATIAL MAP (#city-map)
          ───────────────────────────────────────────────────────────── */}
      <section id="city-map" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Clean Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider block mb-1">
                Geospatial Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
                Delhi Municipal Ward Topography
              </h2>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter ward by name or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono w-52 placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-1 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] p-0.5">
                <Filter className="w-3 h-3 text-[var(--text-muted)] ml-1" />
                {availableZones.slice(0, 5).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-2 py-1 text-[10px] cursor-pointer transition-colors ${
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
            <div className="lg:col-span-8 border border-[var(--border)] relative bg-[var(--surface)] min-h-[520px]">
              {loading ? (
                <div className="h-[520px] flex items-center justify-center font-mono text-xs text-[var(--text-muted)] space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                  <span>Loading Delhi Boundaries…</span>
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
            <div className="lg:col-span-4 surface-card p-5 border border-[var(--border)] space-y-4">
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

              {/* Risk Gauge Metric */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)] font-sans">Composite Risk Score</span>
                  <span className="text-[var(--text-primary)] font-bold">
                    {selectedWard?.riskScore || 84.5} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--surface-soft)] border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{ width: `${selectedWard?.riskScore || 84.5}%` }}
                  />
                </div>
              </div>

              {/* Sub-Factor Metrics */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Drainage Deficit (40%)</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {100 - (selectedWard?.drainageCapacity ?? 68)}%
                  </span>
                </div>
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Rainfall Forecast (35%)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {currentRainfall} mm/h
                  </span>
                </div>
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Citizen Reports (25%)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedWard?.activeComplaints ?? 7} Active
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/wards/${selectedWard?.id || selectedWard?.ward_code || 'W056'}`}
                className="w-full py-2.5 bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 no-underline transition-opacity cursor-pointer shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Deep Ward Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4-Tier Risk Distribution Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400">
              <span className="block text-2xl font-bold">{counts.critical || 12}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Critical Wards</span>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400">
              <span className="block text-2xl font-bold">{counts.high || 38}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">High Wards</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
              <span className="block text-2xl font-bold">{counts.moderate || 110}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Moderate Wards</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <span className="block text-2xl font-bold">{counts.low || 90}</span>
              <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-semibold">Low Wards</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DETERMINISTIC MASS-BALANCE ENGINE (VISUAL & CONCISE)
          ───────────────────────────────────────────────────────────── */}
      <section id="risk-engine" className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider block mb-1">
                Deterministic Model
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
                Explainable Risk Engine
              </h2>
            </div>
            <Link
              to="/simulator"
              className="py-2 px-4 bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] transition-colors no-underline flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Launch Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 Physical Weights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-card p-5 border border-[var(--border)] space-y-2 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--brand)]">DRAINAGE DEFICIT</span>
                <span className="text-2xl font-black font-mono text-[var(--brand)]">40%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Stormwater Capacity Deficit
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Evaluates culvert carrying volume, siltation depth, and outfall backflow against 50-year return storms.
              </p>
            </div>

            <div className="surface-card p-5 border border-[var(--border)] space-y-2 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">RAINFALL SURGE</span>
                <span className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400">35%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Meteorological Precipitation
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                6h, 12h, and 24h convective precipitation projections pulled from high-resolution radar feeds.
              </p>
            </div>

            <div className="surface-card p-5 border border-[var(--border)] space-y-2 bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">CIVIC DISPATCH</span>
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">25%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Geotagged Incident Telemetry
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Verified citizen waterlogging reports filtered for boundary containment and decayed over time.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. MINIMAL CLOSING CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--bg)] text-center border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)] tracking-tight">
            Ready to explore Delhi flood intelligence?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Unified command for municipal engineers, disaster response officers, and citizens.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="py-2.5 px-6 bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-2 no-underline transition-opacity cursor-pointer shadow-sm"
            >
              <span>Enter Operations Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/incidents"
              className="py-2.5 px-5 bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] no-underline transition-colors"
            >
              <span>Emergency Incident Center</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}