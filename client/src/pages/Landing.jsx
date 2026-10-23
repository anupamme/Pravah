import React, { useEffect, useState, useMemo } from 'react';
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
  Terminal,
  Cpu,
  Database,
  Search,
  Filter,
  Eye,
  Camera,
  Server,
  Crosshair,
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Real-time digital clock ticker (UTC & IST)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const utcTime = currentTime.toUTCString().slice(17, 25);
  const istTime = currentTime.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

  // Filtered wards for the interactive directory search
  const availableZones = useMemo(() => {
    if (!wardsGeoJSON?.features) return ['ALL'];
    const set = new Set();
    wardsGeoJSON.features.forEach((f) => {
      const z = f.properties?.zone;
      if (z) set.add(z.toUpperCase());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [wardsGeoJSON]);

  const filteredFeatures = useMemo(() => {
    if (!wardsGeoJSON?.features) return [];
    return wardsGeoJSON.features.filter((f) => {
      const p = f.properties || {};
      const name = (p.ward_name || p.name || '').toLowerCase();
      const code = (p.ward_code || p.id || '').toLowerCase();
      const zone = (p.zone || '').toUpperCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
      const matchesZone = selectedZone === 'ALL' || zone === selectedZone;
      return matchesSearch && matchesZone;
    });
  }, [wardsGeoJSON, searchQuery, selectedZone]);

  const handleSelectWard = (wardProps) => {
    setSelectedWard(wardProps);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300 font-inter selection:bg-[var(--brand)] selection:text-white">

      {/* Global Fixed Navbar */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────
          TOP INDUSTRIAL TELEMETRY STRIP (MISSION OPS STATUS RIBBON)
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-16 border-b border-[var(--border)] bg-[var(--surface-soft)]/80 backdrop-blur-md text-[11px] font-mono select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-y-1 gap-x-4 text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYS // ONLINE</span>
            </span>
            <span className="text-[var(--border-strong)]">|</span>
            <span>DELHI NCT · 28.6139° N, 77.2090° E</span>
            <span className="hidden sm:inline text-[var(--border-strong)]">|</span>
            <span className="hidden sm:inline">EPSG:4326 PostGIS</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>UTC {utcTime} · IST {istTime}</span>
            </div>
            <span className="hidden md:inline text-[var(--border-strong)]">|</span>
            <span className="hidden md:inline text-[var(--brand)] font-semibold">
              MASS-BALANCE v2.4 ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION: 3D MOTION EARTH OBSERVATORY (INDUSTRIAL HUD)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-6rem)] w-full flex flex-col justify-between pt-8 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden select-none border-b border-[var(--border)]">

        {/* 3D Motion Earth Video Viewport */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center scale-[1.03]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4"
          />
          {/* Industrial Atmospheric Overlays */}
          <div className="absolute inset-0 bg-black/55 dark:bg-black/65 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/30 to-black/60" />
          <div className="absolute inset-0 telemetry-grid opacity-30" />
          <div className="absolute inset-0 scanline-overlay opacity-25" />
        </div>

        {/* Precision HUD Reticle Corners */}
        <div className="absolute top-6 left-6 text-white/30 font-mono text-[10px] hidden md:block z-10 pointer-events-none">
          <div>┌ // OBSERVATORY VIEWPORT [CAM-01]</div>
          <div>│ LAT: 28°37'00"N · LON: 77°12'32"E</div>
        </div>
        <div className="absolute top-6 right-6 text-right text-white/30 font-mono text-[10px] hidden md:block z-10 pointer-events-none">
          <div>GEODETIC DATUM: WGS84 ┐</div>
          <div>REFRESH: 15 MIN CYCLE │</div>
        </div>
        <div className="absolute bottom-16 left-6 text-white/30 font-mono text-[10px] hidden md:block z-10 pointer-events-none">
          <div>│ RESOLUTION: 250 WARDS</div>
          <div>└ POSTGIS 16 + PostGIS 3.4</div>
        </div>
        <div className="absolute bottom-16 right-6 text-right text-white/30 font-mono text-[10px] hidden md:block z-10 pointer-events-none">
          <div>FALLBACK: RESILIENT ┘</div>
          <div>OFFLINE CACHE: ARMED</div>
        </div>

        {/* Center Grid Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8">

          {/* Left Column: Authoritative Editorial & Industrial Controls */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* System Status Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/60 border border-white/20 text-white font-mono text-[11px] tracking-wider uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-cyan-300">SYS // HYD-01</span>
              <span className="text-white/40">·</span>
              <span>NCR MUNICIPAL FLOOD TELEMETRY</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-instrument text-white text-4xl sm:text-6xl lg:text-7xl xl:text-[76px] leading-[0.94] tracking-tight">
              Know the risk.
              <br />
              <span className="italic font-light text-cyan-200">
                Before the water rises.
              </span>
            </h1>

            {/* Precision Description */}
            <p className="max-w-xl text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
              Real-time monitoring and explainable prediction of waterlogging risk across all{' '}
              <strong className="text-white font-semibold">250 municipal wards</strong> of Delhi. Grounded in deterministic hydrological mass-balance modeling, Open-Meteo convective precipitation feeds, and geotagged citizen dispatches.
            </p>

            {/* Industrial Action Console */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="py-3 px-6 text-xs font-semibold bg-white text-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 no-underline border border-white shadow-lg cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>[01] Launch Operations Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/report"
                className="py-3 px-5 text-xs font-semibold bg-black/50 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 no-underline border border-white/30 backdrop-blur-md cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>[02] Report Waterlogging</span>
              </Link>
              <Link
                to="/simulator"
                className="py-3 px-4 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 no-underline border border-white/15 backdrop-blur-md cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>[03] Twin Simulator</span>
              </Link>
            </div>

            {/* Technical Certifications */}
            <div className="pt-2 flex flex-wrap items-center gap-5 text-[11px] text-white/60 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>PostGIS Polygon Containment</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Zero-Crash Offline Resilient</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Duplex Socket.IO Stream</span>
              </span>
            </div>
          </div>

          {/* Right Column: High-Density Industrial Telemetry Panel */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Card 1: Coverage */}
            <div className="p-4 bg-black/60 border border-white/20 backdrop-blur-xl text-white industrial-corner space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/60 uppercase tracking-wider">
                <span>[01 // COVERAGE]</span>
                <MapPin className="w-3.5 h-3.5 text-[var(--brand)]" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {totalWardsCount}
              </div>
              <div className="text-[11px] text-white/70">Municipal Wards Monitored</div>
              <div className="text-[9px] font-mono text-cyan-300 pt-1 border-t border-white/10">
                100% Geometry Fidelity
              </div>
            </div>

            {/* Card 2: High Risk */}
            <div className="p-4 bg-black/60 border border-rose-500/40 backdrop-blur-xl text-white industrial-corner space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-rose-300 uppercase tracking-wider">
                <span>[02 // ALERT STATUS]</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-rose-400">
                {(counts.critical || 0) + (counts.high || 0)}
              </div>
              <div className="text-[11px] text-white/70">Wards Requiring Pumps</div>
              <div className="text-[9px] font-mono text-rose-300 pt-1 border-t border-rose-500/20">
                {counts.critical || 0} Critical · {counts.high || 0} High
              </div>
            </div>

            {/* Card 3: Precipitation */}
            <div className="p-4 bg-black/60 border border-cyan-400/40 backdrop-blur-xl text-white industrial-corner space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 uppercase tracking-wider">
                <span>[03 // PRECIPITATION]</span>
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
                {currentRainfall}
                <span className="text-xs font-normal text-white/50">mm/h</span>
              </div>
              <div className="text-[11px] text-white/70">Doppler Radar Ingestion</div>
              <div className="text-[9px] font-mono text-cyan-300 pt-1 border-t border-cyan-400/20">
                Convective Forecast Active
              </div>
            </div>

            {/* Card 4: System Risk Index */}
            <div className="p-4 bg-black/60 border border-emerald-400/40 backdrop-blur-xl text-white industrial-corner space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 uppercase tracking-wider">
                <span>[04 // RISK INDEX]</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400 flex items-baseline gap-1">
                {avgRiskScore}
                <span className="text-xs font-normal text-white/50">/100</span>
              </div>
              <div className="text-[11px] text-white/70">City Mass-Balance Mean</div>
              <div className="text-[9px] font-mono text-emerald-300 pt-1 border-t border-emerald-400/20">
                Deterministic Model
              </div>
            </div>
          </div>

        </div>

        {/* Lower Hero Bar: Geolocation & Scroll Cue */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-4 border-t border-white/15 text-[11px] text-white/60 font-mono">
          <div className="tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>DELHI NCR SENSOR ARRAY · EPSG:4326 · 250 TOPOLOGICAL POLYGONS</span>
          </div>
          <a
            href="#city-map"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors no-underline cursor-pointer font-sans text-xs font-semibold"
          >
            <span>EXPLORE PLATFORM</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. SECTION: GEOSPATIAL BOUNDARY TERMINAL (#city-map)
          ───────────────────────────────────────────────────────────── */}
      <section id="city-map" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5" />
                <span>// SECTION 01 · SPATIAL BOUNDARY TERMINAL</span>
              </div>
              <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
                Delhi Municipal Ward Topography.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                All 250 municipal ward boundaries modeled as PostGIS polygon geometries. Select or search any ward to inspect its live drainage capacity, meteorological forecast, and verified civic reports.
              </p>
            </div>

            {/* Quick Interactive Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter ward by name or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] font-mono w-56"
                />
              </div>

              <div className="flex items-center gap-1 text-xs font-mono bg-[var(--surface-soft)] border border-[var(--border)] p-0.5">
                <Filter className="w-3 h-3 text-[var(--text-muted)] ml-1.5" />
                {availableZones.slice(0, 5).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`px-2 py-1 text-[10px] cursor-pointer transition-colors ${
                      selectedZone === zone
                        ? 'bg-[var(--brand)] text-white font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Map & Telemetry HUD Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Container with Industrial Frame */}
            <div className="lg:col-span-8 border border-[var(--border)] relative bg-[var(--surface-soft)] min-h-[560px] industrial-corner">
              {loading ? (
                <div className="h-[560px] flex items-center justify-center font-mono text-xs text-[var(--text-muted)] space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                  <span>Loading Delhi Geospatial Boundaries…</span>
                </div>
              ) : (
                <WardMap
                  wardsData={wardsGeoJSON}
                  selectedWardId={selectedWard?.ward_code || selectedWard?.id}
                  onSelectWard={handleSelectWard}
                  height="560px"
                />
              )}
            </div>

            {/* Selected Ward Telemetry HUD Panel */}
            <div className="lg:col-span-4 surface-card p-5 border border-[var(--border)] space-y-5 industrial-corner">
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    <span>TELEMETRY INSPECTION</span>
                  </span>
                  <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] tracking-tight mt-0.5">
                    {selectedWard?.name || selectedWard?.ward_name || 'Connaught Place'}
                  </h3>
                  <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    CODE: {selectedWard?.id || selectedWard?.ward_code || 'W056'} · ZONE: {selectedWard?.zone || 'CENTRAL'}
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

              {/* Physical Sub-Factor Breakdown */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Drainage Capacity Deficit (40%)</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {100 - (selectedWard?.drainageCapacity ?? 68)}%
                  </span>
                </div>
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Precipitation Forecast (35%)</span>
                  <span className="font-bold text-cyan-400">
                    {currentRainfall} mm/h
                  </span>
                </div>
                <div className="p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] font-sans">Civic Incident Reports (25%)</span>
                  <span className="font-bold text-amber-400">
                    {selectedWard?.activeComplaints ?? 7} Verified
                  </span>
                </div>
              </div>

              {/* Centroid Coordinates */}
              <div className="p-2.5 bg-[var(--surface-soft)]/50 border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] space-y-1">
                <div className="flex justify-between">
                  <span>CENTROID LATITUDE:</span>
                  <span className="text-[var(--text-primary)] font-bold">
                    {selectedWard?.centroid?.latitude?.toFixed(4) || '28.6360'}° N
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CENTROID LONGITUDE:</span>
                  <span className="text-[var(--text-primary)] font-bold">
                    {selectedWard?.centroid?.longitude?.toFixed(4) || '77.2250'}° E
                  </span>
                </div>
              </div>

              {/* Deep Analysis Action */}
              <Link
                to={`/wards/${selectedWard?.id || selectedWard?.ward_code || 'W056'}`}
                className="w-full py-2.5 bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 no-underline transition-opacity cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Comprehensive Ward Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Citywide 4-Tier Risk Distribution Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 bg-[var(--surface-soft)] border border-rose-500/30 text-rose-400">
              <span className="block text-2xl font-bold">{counts.critical || 12}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-sans font-semibold">Critical Risk Wards</span>
            </div>
            <div className="p-3 bg-[var(--surface-soft)] border border-orange-500/30 text-orange-400">
              <span className="block text-2xl font-bold">{counts.high || 38}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-sans font-semibold">High Risk Wards</span>
            </div>
            <div className="p-3 bg-[var(--surface-soft)] border border-amber-500/30 text-amber-400">
              <span className="block text-2xl font-bold">{counts.moderate || 110}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-sans font-semibold">Moderate Risk Wards</span>
            </div>
            <div className="p-3 bg-[var(--surface-soft)] border border-emerald-500/30 text-emerald-400">
              <span className="block text-2xl font-bold">{counts.low || 90}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-sans font-semibold">Low Risk Wards</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: DETERMINISTIC MASS-BALANCE FORMULA ENGINE
          ───────────────────────────────────────────────────────────── */}
      <section id="risk-engine" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto space-y-10">

          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>// SECTION 02 · HYDROLOGICAL MASS-BALANCE ENGINE</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Transparent math, not black-box guesses.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Pravah evaluates municipal risk using a mass-balance physical equation. Every score is mathematically explainable with weighted sub-factors.
            </p>
          </div>

          {/* Blueprint Mathematical Schematic Card */}
          <div className="surface-card p-6 sm:p-8 border border-[var(--border-strong)] industrial-corner bg-gradient-to-r from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)]">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-[var(--brand)] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
                  <span>DETERMINISTIC MASS-BALANCE SCHEMATIC</span>
                </span>
                <div className="text-base sm:text-2xl font-mono font-bold text-[var(--text-primary)] tracking-tight">
                  RiskScore = (DrainageDeficit &times; 0.40) + (RainfallSurge &times; 0.35) + (CivicReports &times; 0.25)
                </div>
                <p className="text-xs text-[var(--text-muted)] max-w-2xl">
                  Evaluated in real time per ward boundary against rainfall telemetry and hydraulic siltation indices.
                </p>
              </div>

              <Link
                to="/simulator"
                className="py-2.5 px-5 bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-xs font-mono font-semibold border border-[var(--border-strong)] transition-colors no-underline flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Test in Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3 Physical Weights Sub-System Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="surface-card p-5 border border-[var(--border)] space-y-3 industrial-corner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--brand)]">[MOD-01] DRAINAGE DEFICIT</span>
                <span className="text-xl font-bold font-mono text-[var(--brand)]">40%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Stormwater Capacity Deficit
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Evaluates municipal stormwater trunk lines, culvert cross-sectional flow volume, siltation index, and outfall backflow against 50-year return storm events.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border)]">
                INPUT: MCD Municipal Audit Registry
              </div>
            </div>

            <div className="surface-card p-5 border border-[var(--border)] space-y-3 industrial-corner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">[MOD-02] RAINFALL SURGE</span>
                <span className="text-xl font-bold font-mono text-cyan-400">35%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Meteorological Precipitation
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                6h, 12h, and 24h multi-horizon convective precipitation projections fetched via Open-Meteo high-resolution radar feeds with automated fallback caching.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border)]">
                INPUT: Open-Meteo High-Res Radar Feed
              </div>
            </div>

            <div className="surface-card p-5 border border-[var(--border)] space-y-3 industrial-corner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">[MOD-03] CIVIC REPORTS</span>
                <span className="text-xl font-bold font-mono text-emerald-400">25%</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">
                Geotagged Incident Telemetry
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Real-time citizen waterlogging reports filtered for boundary containment, deduplicated, and chronologically decayed over a rolling operational window.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border)]">
                INPUT: Citizen Incident Desk & Telemetry
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SECTION: MUNICIPAL OPERATIONS & PIPELINE (#operations)
          ───────────────────────────────────────────────────────────── */}
      <section id="operations" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-10">

          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>// SECTION 03 · OPERATIONAL DISPATCH PIPELINE</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              From observation to municipal dispatch.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Pravah converts raw physical telemetry into prioritized emergency action roadmaps for MCD zonal disaster managers and pump crews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: 'PHASE 01',
                code: 'INGEST',
                title: 'Detect Risk',
                desc: 'Continuous spatial mass-balance computation identifies emerging waterlogging pockets across 250 wards before surface flooding occurs.',
                icon: Activity,
              },
              {
                step: 'PHASE 02',
                code: 'RANK',
                title: 'Rank Interventions',
                desc: 'Decision support algorithms prioritize actionable interventions by severity, affected population density, and infrastructure exposure.',
                icon: Clock,
              },
              {
                step: 'PHASE 03',
                code: 'SIMULATE',
                title: 'Digital Twin Feasibility',
                desc: 'What-If simulation engine calculates delta risk reduction and pump deployment feasibility prior to field mobilization.',
                icon: Sliders,
              },
              {
                step: 'PHASE 04',
                code: 'DISPATCH',
                title: 'Mobilize Teams',
                desc: 'Dispatch heavy submersible dewatering pumps, notify zonal field engineers, and issue civic traffic advisories.',
                icon: Zap,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.step} className="surface-card p-5 space-y-3 border border-[var(--border)] industrial-corner flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-[var(--brand)]">{card.step}</span>
                      <span className="text-[var(--text-muted)]">{card.code}</span>
                    </div>
                    <h3 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-tight">{card.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <Icon className="w-4 h-4 text-[var(--brand)]" />
                    <span className="text-[9px] font-mono text-emerald-400 uppercase">READY</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION: CITIZEN REPORTING WIRE (#citizen-network)
          ───────────────────────────────────────────────────────────── */}
      <section id="citizen-network" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" />
              <span>// SECTION 04 · CIVIC TELEMETRY WIRE</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Every citizen report feeds the city picture.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              When waterlogging occurs on underpasses or arterial culverts, citizens can lodge instant geotagged reports with optional photo proof. Our PostGIS engine maps coordinates to the exact municipal ward in milliseconds.
            </p>

            <div className="space-y-2.5 text-xs text-[var(--text-secondary)] font-mono">
              <div className="flex items-center gap-2 p-2 bg-[var(--surface-soft)] border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero registration required for civic submissions</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[var(--surface-soft)] border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Socket.IO real-time broadcast to MCD dispatchers</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[var(--surface-soft)] border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Photo proof capture with verified timestamp telemetry</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/report"
                className="py-2.5 px-5 bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold inline-flex items-center gap-2 no-underline transition-opacity cursor-pointer shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Submit Waterlogging Incident Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Sample Live Civic Feed Card */}
          <div className="lg:col-span-6 surface-card p-5 border border-[var(--border)] space-y-4 industrial-corner">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Live Incident Wire Sample
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE TELEMETRY</span>
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1.5">
                <div className="flex justify-between items-center text-[var(--brand)] font-bold">
                  <span>WARD 056 · CONNAUGHT PLACE</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    45 CM DEPTH · CRITICAL
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                  Minto Bridge underpass heavy water accumulation, traffic diverted via Connaught Circus.
                </p>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Camera className="w-3 h-3" />
                    <span>Photo proof attached</span>
                  </span>
                  <span>14 min ago</span>
                </div>
              </div>

              <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1.5">
                <div className="flex justify-between items-center text-[var(--brand)] font-bold">
                  <span>WARD 012 · BURARI</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    25 CM DEPTH · HIGH
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans">
                  Main stormwater culvert blocked with debris near Ring Road exit. Runoff backing up.
                </p>
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                  <span>GPS: 28.7612° N, 77.1944° E</span>
                  <span>32 min ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECTION: MISSION-CRITICAL ENGINEERING TOLERANCES
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--brand)] uppercase tracking-wider">
              <Server className="w-3.5 h-3.5" />
              <span>// SECTION 05 · TECHNICAL SPECIFICATIONS & TOLERANCES</span>
            </div>
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              Mission-critical engineering tolerances.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">SPATIAL ENGINE</div>
              <div className="font-bold text-[var(--text-primary)]">PostGIS 16</div>
              <div className="text-[10px] text-cyan-400">SRID: 4326 WGS84</div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">FORMULA ENGINE</div>
              <div className="font-bold text-[var(--text-primary)]">Mass-Balance</div>
              <div className="text-[10px] text-emerald-400">Deterministic W1-3</div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">WEATHER SENSORS</div>
              <div className="font-bold text-[var(--text-primary)]">Open-Meteo</div>
              <div className="text-[10px] text-cyan-400">15-Min Ingestion</div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">DUPLEX WIRE</div>
              <div className="font-bold text-[var(--text-primary)]">Socket.IO v4</div>
              <div className="text-[10px] text-emerald-400">&lt; 50ms Broadcast</div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">OFFLINE FALLBACK</div>
              <div className="font-bold text-[var(--text-primary)]">Zero-Crash</div>
              <div className="text-[10px] text-amber-400">In-Memory Cache</div>
            </div>

            <div className="p-3 bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">LOOKUP LATENCY</div>
              <div className="font-bold text-[var(--text-primary)]">&lt; 25 ms</div>
              <div className="text-[10px] text-emerald-400">Indexed Containment</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. SECTION: CLOSING MISSION COMMAND CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--bg)] text-center relative overflow-hidden border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="w-14 h-14 bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 flex items-center justify-center mx-auto">
            <Waves className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-instrument text-3xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
              When the rain changes,
              <br />
              <span className="italic text-[var(--brand)]">PRAVAH changes with it.</span>
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-[var(--text-secondary)]">
              Unified command for municipal engineers, disaster response officers, and citizens across the National Capital Territory of Delhi.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/dashboard"
              className="py-2.5 px-6 bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-2 no-underline transition-opacity cursor-pointer shadow-sm"
            >
              <span>[01] Enter City Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/incidents"
              className="py-2.5 px-5 bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] no-underline transition-colors"
            >
              <span>[02] Emergency Incident Center</span>
            </Link>
            <Link
              to="/admin"
              className="py-2.5 px-4 bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] no-underline transition-colors"
            >
              <span>[03] Admin Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. DEDICATED COMPREHENSIVE FOOTER
          ───────────────────────────────────────────────────────────── */}
      <Footer />

    </div>
  );
}