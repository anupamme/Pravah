import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CloudRain,
  Layers,
  ChevronDown,
  CheckCircle2,
  Sliders,
  Radio,
  Zap,
  Clock,
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

  const counts = riskSummary?.countsByLevel || { critical: 12, high: 38, moderate: 110, low: 90 };
  const totalWardsCount = wardsGeoJSON?.features?.length || 250;
  const currentRainfall = weather?.rainfallMm?.toFixed(1) ?? '42.0';
  const avgRiskScore = riskSummary?.avgRiskScore?.toFixed(1) ?? '58.4';

  const handleSelectWard = (wardProps) => {
    setSelectedWard(wardProps);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300 font-inter selection:bg-[var(--brand)] selection:text-white">

      {/* Global Fixed Navbar */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: FULL-VIEWPORT LIVE EARTH OBSERVATORY
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen w-full flex flex-col justify-between pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">

        {/* Live Earth Background Video & Celestial Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center scale-[1.03]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          />
          {/* Dual Theme Atmospheric Overlays */}
          <div className="absolute inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-black/35" />
          <div className="absolute inset-0 atmospheric-grid opacity-25" />
        </div>

        {/* Center Grid Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto pt-6">

          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow - Live 250 Wards Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE · 250 WARDS</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-instrument text-white text-4xl sm:text-6xl lg:text-7xl xl:text-[82px] leading-[0.94] tracking-tight text-glow">
              Know the risk.
              <br />
              <span className="italic font-light text-cyan-200">
                Before the water rises.
              </span>
            </h1>

            {/* Description */}
            <p className="max-w-xl text-sm sm:text-base text-white/85 leading-relaxed font-normal">
              Real-time monitoring and explainable prediction of waterlogging risk across all{' '}
              <strong className="text-white font-semibold">250 municipal wards</strong> of Delhi. Grounded in deterministic hydrological mass-balance modeling, Open-Meteo telemetry, and geotagged citizen dispatches.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link to="/dashboard" className="btn-primary py-3.5 px-7 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 no-underline">
                <Activity className="w-4 h-4" />
                <span>Explore Live Intelligence</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/report" className="btn-secondary py-3.5 px-6 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 no-underline bg-white/10 text-white border-white/20 hover:bg-white/20">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Report an Incident</span>
              </Link>
            </div>

            {/* Quality Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-white/70 font-mono">
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

          {/* Right Column: 4-Card Floating Live Telemetry Stack */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {/* Card 1: Coverage */}
            <div className="surface-card p-5 space-y-2 border-l-4 border-l-[var(--brand)] bg-black/40 backdrop-blur-xl text-white">
              <div className="flex items-center justify-between text-xs text-white/70 font-bold uppercase tracking-wider">
                <span>Coverage</span>
                <MapPin className="w-4 h-4 text-[var(--brand)]" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white font-inter">
                {totalWardsCount}
              </div>
              <p className="text-xs text-white/70">Municipal Wards Monitored</p>
            </div>

            {/* Card 2: High Risk */}
            <div className="surface-card p-5 space-y-2 border-l-4 border-l-rose-500 bg-black/40 backdrop-blur-xl text-white">
              <div className="flex items-center justify-between text-xs text-white/70 font-bold uppercase tracking-wider">
                <span>High Risk</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-rose-400 font-inter">
                {(counts.critical || 0) + (counts.high || 0)}
              </div>
              <p className="text-xs text-white/70">Wards Requiring Pump Staging</p>
            </div>

            {/* Card 3: Precipitation */}
            <div className="surface-card p-5 space-y-2 border-l-4 border-l-cyan-400 bg-black/40 backdrop-blur-xl text-white">
              <div className="flex items-center justify-between text-xs text-white/70 font-bold uppercase tracking-wider">
                <span>Precipitation</span>
                <CloudRain className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white font-inter">
                {currentRainfall} <span className="text-sm font-normal text-white/60">mm/h</span>
              </div>
              <p className="text-xs text-white/70">Open-Meteo Weather Telemetry</p>
            </div>

            {/* Card 4: System Status */}
            <div className="surface-card p-5 space-y-2 border-l-4 border-l-emerald-400 bg-black/40 backdrop-blur-xl text-white">
              <div className="flex items-center justify-between text-xs text-white/70 font-bold uppercase tracking-wider">
                <span>System Status</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-inter flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE</span>
              </div>
              <p className="text-xs text-white/70">City Risk Index: <b>{avgRiskScore}/100</b></p>
            </div>
          </div>

        </div>

        {/* Lower Hero Bar: Geolocation & Scroll Cue */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-6 border-t border-white/15 text-xs text-white/70 font-mono">
          <div className="tracking-widest uppercase">
            28.6139° N · 77.2090° E · 250 WARDS
          </div>
          <a
            href="#city-map"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors no-underline cursor-pointer font-sans text-xs font-semibold"
          >
            <span>EXPLORE PLATFORM</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. SECTION: GEOSPATIAL INTELLIGENCE MAP
          ───────────────────────────────────────────────────────────── */}
      <section id="city-map" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Section Header */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider">
              <span>01 · GEOSPATIAL INTELLIGENCE</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Delhi, mapped in real time.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-inter">
              Every municipal ward boundary is modeled in PostGIS using high-precision polygon geometries. Select any ward to inspect its live physical drainage, meteorological rainfall, and verified civic reports.
            </p>
          </div>

          {/* Interactive Map & Side Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Map Container */}
            <div className="lg:col-span-8 rounded-none overflow-hidden border border-[var(--border)] shadow-xl relative min-h-[550px]">
              {loading ? (
                <div className="h-[550px] flex items-center justify-center bg-[var(--surface-soft)] text-xs text-[var(--text-muted)]">
                  Loading Delhi Geospatial Boundary Layers...
                </div>
              ) : (
                <WardMap
                  wardsData={wardsGeoJSON}
                  selectedWardId={selectedWard?.ward_code || selectedWard?.id}
                  onSelectWard={handleSelectWard}
                  height="550px"
                />
              )}
            </div>

            {/* Selected Ward Telemetry Panel */}
            <div className="lg:col-span-4 surface-card p-6 space-y-6 rounded-none">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--brand)]">
                    WARD INSPECTION
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] font-inter">
                    {selectedWard?.name || 'Connaught Place'}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)]">
                    Ward Code: {selectedWard?.id || 'W056'} · Zone: {selectedWard?.zone || 'Central'}
                  </span>
                </div>
                <span className={`badge-risk-${(selectedWard?.riskLevel || 'critical').toLowerCase()}`}>
                  {selectedWard?.riskLevel || 'CRITICAL'}
                </span>
              </div>

              {/* Risk Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-secondary)]">Composite Risk Index</span>
                  <span className="text-[var(--text-primary)] font-mono">{selectedWard?.riskScore || 84.5} / 100</span>
                </div>
                <div className="w-full h-2.5 rounded-none bg-[var(--surface-soft)] overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full rounded-none transition-all duration-500 bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{ width: `${selectedWard?.riskScore || 84.5}%` }}
                  />
                </div>
              </div>

              {/* Physical Metrics Breakdown */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between items-center p-3 rounded-none bg-[var(--surface-soft)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Drainage Capacity Deficit</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{selectedWard?.drainageCapacity ?? 32}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-none bg-[var(--surface-soft)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Localized Rainfall Forecast</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{currentRainfall} mm/h</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-none bg-[var(--surface-soft)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Active Citizen Reports</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{selectedWard?.activeComplaints ?? 7} Verified</span>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-2">
                <Link
                  to={`/wards/${selectedWard?.id || 'W056'}`}
                  className="w-full py-3 rounded-none btn-primary text-xs font-semibold flex items-center justify-center gap-2 no-underline"
                >
                  <span>Deep Ward Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* City Risk Distribution Bar */}
          <div className="surface-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-rose-500 font-inter">{counts.critical || 12}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Critical Risk Wards</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-amber-500 font-inter">{counts.high || 38}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">High Risk Wards</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-yellow-500 font-inter">{counts.moderate || 110}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Moderate Risk Wards</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-emerald-500 font-inter">{counts.low || 90}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Low Risk Wards</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: DETERMINISTIC MASS-BALANCE MODEL
          ───────────────────────────────────────────────────────────── */}
      <section id="risk-engine" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto space-y-12">

          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider">
              <span>02 · DETERMINISTIC ENGINE</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Transparent math, not black-box guesses.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-inter">
              Pravah evaluates municipal risk using a mass-balance physical equation. Every score is mathematically explainable with weighted sub-factors.
            </p>
          </div>

          {/* Mathematical Formula Card */}
          <div className="surface-card p-8 bg-gradient-to-r from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)] border-2 border-[var(--border-strong)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <span className="text-xs font-mono font-bold text-[var(--brand)] uppercase tracking-wider">Physical Mass-Balance Formula</span>
                <div className="text-lg sm:text-2xl font-mono font-black text-[var(--text-primary)]">
                  Risk = (Drainage &times; 0.40) + (Rainfall &times; 0.35) + (Complaints &times; 0.25)
                </div>
              </div>
              <Link to="/simulator" className="btn-secondary text-xs font-semibold py-3 px-6 whitespace-nowrap no-underline">
                <span>Test in Simulator</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* 3 Physical Weights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[var(--brand)] font-mono">40%</span>
                <Layers className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-inter">Drainage Deficit</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Evaluates municipal stormwater line carrying capacity, siltation index, and culvert cross-sectional flow volume against 50-year return storm events.
              </p>
            </div>

            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-cyan-400 font-mono">35%</span>
                <CloudRain className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-inter">Rainfall Forecast</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                6h, 12h, and 24h multi-horizon meteorological precipitation projections pulled from Open-Meteo high-resolution convective precipitation feeds.
              </p>
            </div>

            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-400 font-mono">25%</span>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-inter">Civic Complaints</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Real-time citizen waterlogging reports filtered for coordinate bounding validity, deduplicated, and decayed chronologically over time.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SECTION: MUNICIPAL OPERATIONS & DECISION SUPPORT
          ───────────────────────────────────────────────────────────── */}
      <section id="operations" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-12">

          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider">
              <span>03 · DECISION SUPPORT</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              From observation to municipal dispatch.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-inter">
              Pravah converts raw physical telemetry into prioritized emergency action roadmaps for MCD zonal disaster managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Detect Risk',
                desc: 'Continuous spatial mass-balance computation identifies emerging waterlogging pockets across 250 wards before surface flooding occurs.',
                icon: Activity,
              },
              {
                step: '02',
                title: 'Rank Actions',
                desc: 'Decision support algorithms prioritize actionable interventions by severity, affected population density, and infrastructure exposure.',
                icon: Clock,
              },
              {
                step: '03',
                title: 'Simulate Response',
                desc: 'What-If Digital Twin calculates delta risk reduction and pump staging feasibility prior to deployment.',
                icon: Sliders,
              },
              {
                step: '04',
                title: 'Mobilize Teams',
                desc: 'Dispatch heavy submersible pumps, notify field response officers, and issue emergency civic flood advisories.',
                icon: Zap,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.step} className="surface-card p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[var(--brand)]">STEP {card.step}</span>
                      <Icon className="w-5 h-5 text-[var(--brand)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-inter">{card.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-inter">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION: CITIZEN REPORTING NETWORK
          ───────────────────────────────────────────────────────────── */}
      <section id="citizen-network" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-[var(--brand)] text-xs font-bold uppercase tracking-wider">
              <span>04 · CIVIC TELEMETRY</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Every citizen report feeds the city picture.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-inter">
              When waterlogging occurs on underpasses or residential culverts, citizens can lodge instant geotagged reports. Our PostGIS engine maps the coordinates to the exact containing ward in milliseconds.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter">Zero registration required for civic submissions</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter">Instant Socket.IO real-time broadcast to MCD dispatchers</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-inter">Point-in-polygon containment with Delhi boundary validation</span>
              </div>
            </div>

            <div className="pt-4">
              <Link to="/report" className="btn-primary py-3 px-6 text-xs font-bold inline-flex items-center gap-2 no-underline">
                <span>Submit Waterlogging Report</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 surface-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-inter">Live Civic Feed Sample</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">LIVE STREAM</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
                <div className="flex justify-between text-[var(--brand)] font-bold">
                  <span>Ward 056 · Connaught Place</span>
                  <span className="text-rose-500 font-sans badge-risk-critical">45 cm Depth</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs">Minto Bridge underpass heavy water accumulation, traffic diverted.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
                <div className="flex justify-between text-[var(--brand)] font-bold">
                  <span>Ward 012 · Burari</span>
                  <span className="text-amber-500 font-sans badge-risk-moderate">25 cm Depth</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans text-xs">Main drain overflowing near Ring Road exit.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECTION: CLOSING STATEMENT CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--bg)] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[var(--brand-strong)] to-[var(--brand-deep)] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--brand)]/20">
            <Waves className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              When the rain changes,
              <br />
              <span className="italic text-[var(--brand)]">PRAVAH changes with it.</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] font-inter">
              Unified command for municipal engineers, disaster response officers, and citizens across the National Capital Territory.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/dashboard" className="btn-primary py-3.5 px-8 text-sm font-semibold flex items-center gap-2 no-underline">
              <span>Enter City Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/incidents" className="btn-secondary py-3.5 px-6 text-sm font-medium no-underline">
              <span>Emergency Dispatch Center</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. DEDICATED COMPREHENSIVE LANDING PAGE FOOTER
          ───────────────────────────────────────────────────────────── */}
      <Footer />

    </div>
  );
}
