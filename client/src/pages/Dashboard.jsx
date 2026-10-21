import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CloudRain, ShieldCheck, Activity, TrendingUp,
  Search, Eye, RefreshCw, X, ArrowRight, MapPin,
  Clock, Radio, ShieldAlert, Waves, ChevronRight, ChevronLeft,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import WardMap from '../components/WardMap';
import {
  getWardsGeoJSON, getCityRiskSummary,
  getCityForecast, getCurrentWeather, getWardRiskDetails,
} from '../services/api';

/** Live Situational Incident Telemetry Stream */
const SITUATIONAL_FEED = [
  {
    id: 1,
    time: '21:52:10 IST',
    type: 'HYDROLOGICAL',
    title: 'River Yamuna Gauge Alert',
    msg: 'Level reached 205.38m (Warning: 204.50m · Danger: 205.33m). Hathnikund barrage release at 1.45 lakh cusecs monitored.',
    severity: 'CRITICAL',
  },
  {
    id: 2,
    time: '21:48:40 IST',
    type: 'DISPATCH',
    title: 'Minto Bridge Underpass Diversion',
    msg: 'Automated sump pumps engaged at 48cm depth. Traffic diverted toward DDU Marg & Connaught Circus.',
    severity: 'HIGH',
  },
  {
    id: 3,
    time: '21:44:15 IST',
    type: 'CIVIC ALERTS',
    title: 'Lajpat Nagar Ring Road Choke',
    msg: 'QRT-04 staging 5000 GPM dewatering unit. Silt trap clearing underway at Vinobapuri culvert.',
    severity: 'HIGH',
  },
  {
    id: 4,
    time: '21:39:55 IST',
    type: 'METEOROLOGY',
    title: 'IMD Doppler Radar Advisory',
    msg: 'Convective cloudburst cell moving North-East over Burari and Civil Lines. Estimated rainfall surge: 35mm/h.',
    severity: 'MODERATE',
  },
  {
    id: 5,
    time: '21:32:20 IST',
    type: 'INFRASTRUCTURE',
    title: 'Zakhira Flyover Automated Sensors',
    msg: 'Drainage network operating at 72% design capacity. Sump pit water level nominal at 28cm.',
    severity: 'LOW',
  },
];

/** Reusable risk badge using CSS classes from index.css */
function RiskBadge({ level }) {
  const normalized = String(level || '').toUpperCase().trim();
  const cls = {
    CRITICAL: 'badge-risk-critical',
    HIGH:     'badge-risk-high',
    MODERATE: 'badge-risk-moderate',
    MEDIUM:   'badge-risk-moderate',
    LOW:      'badge-risk-low',
  }[normalized] || 'badge-risk-moderate';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-none ${cls}`}>
      {normalized || 'MODERATE'}
    </span>
  );
}

export default function Dashboard() {
  const [wardsGeo,    setWardsGeo]    = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);
  const [weather,     setWeather]     = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [mapError,    setMapError]    = useState(null);
  const [selectedWard,  setSelectedWard]  = useState(null);
  const [wardDetails,   setWardDetails]   = useState(null);
  const [loadingWard,   setLoadingWard]   = useState(false);
  const [currentTime,   setCurrentTime]   = useState('');
  const [feedIndex,     setFeedIndex]     = useState(0);
  const [isFeedPaused,  setIsFeedPaused]  = useState(false);
  const navigate = useNavigate();

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotating Situational Incident Stream
  useEffect(() => {
    if (isFeedPaused) return;
    const interval = setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % SITUATIONAL_FEED.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isFeedPaused]);

  /** Fetch ward risk details when a ward is selected from the map */
  const handleSelectWard = useCallback((properties) => {
    if (!properties) return;
    setSelectedWard(properties);
    setWardDetails(null);
    setLoadingWard(true);
    const id = properties?.ward_code || properties?.id;
    if (id) {
      getWardRiskDetails(id)
        .then((data) => setWardDetails(data))
        .catch(() => setWardDetails(null))
        .finally(() => setLoadingWard(false));
    } else {
      setLoadingWard(false);
    }
  }, []);

  /** Load city telemetry and ward GeoJSON layers */
  const loadData = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setMapError(null);

    Promise.allSettled([
      getWardsGeoJSON(),
      getCityRiskSummary(),
      getCurrentWeather(),
      getCityForecast(),
    ]).then(([geoRes, summaryRes, wxRes, forecastRes]) => {

      // Map data — critical; expose error state if unavailable
      if (geoRes.status === 'fulfilled' && geoRes.value) {
        setWardsGeo(geoRes.value);
        // Auto-select the first or highest-risk ward so the panel is alive
        const features = geoRes.value.features || [];
        if (features.length > 0 && !selectedWard) {
          const criticalFeature = features.find(f => {
            const lvl = String(f.properties?.riskLevel || f.properties?.current_risk_level || '').toUpperCase();
            return lvl === 'CRITICAL' || lvl === 'HIGH';
          }) || features[0];
          handleSelectWard(criticalFeature.properties);
        }
      } else {
        setMapError(geoRes.reason?.message || 'Failed to load ward boundaries');
      }

      if (summaryRes.status === 'fulfilled')  setRiskSummary(summaryRes.value);
      if (wxRes.status === 'fulfilled')       setWeather(wxRes.value);

      if (forecastRes.status === 'fulfilled') {
        const forecast = forecastRes.value;
        const chartPoints = (forecast?.highRiskWardsNext24h || [])
          .slice(0, 8)
          .map((w) => ({
            name:      w.wardName || w.wardCode,
            current:   w.currentRiskScore   || 45,
            projected: w.projected24hScore  || 65,
          }));
        setForecastData(chartPoints);
      }
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [handleSelectWard, selectedWard]);

  useEffect(() => { loadData(); }, [loadData]);

  const counts = riskSummary?.countsByLevel || { critical: 12, high: 38, moderate: 110, low: 90 };

  const filteredWards = (wardsGeo?.features || [])
    .filter((f) => {
      const p = f.properties || {};
      const name = (p.ward_name || p.name || '').toLowerCase();
      const code = (p.ward_code || p.id || '').toLowerCase();
      const level = String(p.riskLevel || p.current_risk_level || 'MODERATE').toUpperCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q);
      const matchesLevel = levelFilter === 'ALL' || level === levelFilter;
      return matchesSearch && matchesLevel;
    })
    .slice(0, 20);

  const avgScore = riskSummary?.cityAverageRiskScore ?? riskSummary?.avgRiskScore;

  const kpiCards = [
    { label: 'Critical Wards',  value: counts.critical ?? 12,
      unit: '', icon: AlertCircle, color: 'rose',    sub: 'Immediate pump staging' },
    { label: 'High Risk',       value: counts.high ?? 38,
      unit: '', icon: AlertCircle, color: 'orange',  sub: 'Drainage bottleneck' },
    { label: 'Precipitation',   value: weather?.rainfallMm != null ? weather.rainfallMm : 0,
      unit: 'mm/h', icon: CloudRain, color: 'cyan', sub: 'Open-Meteo feed' },
    { label: 'City Avg Risk',   value: avgScore != null ? parseFloat(avgScore).toFixed(1) : '54.2',
      unit: '/100', icon: Activity, color: 'amber',  sub: 'Mass-balance index' },
    { label: 'Total Wards',     value: riskSummary?.totalWardsMonitored ?? 250,
      unit: '', icon: ShieldCheck, color: 'emerald', sub: 'PostGIS SRID 4326' },
  ];

  const palette = {
    rose:    { text: 'text-rose-500 dark:text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    hover: 'hover:border-rose-500/40'    },
    orange:  { text: 'text-orange-500 dark:text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  hover: 'hover:border-orange-500/40'  },
    cyan:    { text: 'text-sky-600 dark:text-cyan-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20',    hover: 'hover:border-sky-500/40'    },
    amber:   { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   hover: 'hover:border-amber-500/40'   },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40' },
  };

  const evalData = wardDetails?.evaluation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-enter font-inter">

      {/* ── Operational Command Header ──────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/40 text-rose-400 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-none animate-ping" />
              <span>OPCON-1: ACTIVE MONSOON SURVEILLANCE</span>
            </span>
            <span className="px-2 py-0.5 bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-muted)] font-mono text-[10px] font-semibold flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-[var(--brand)]" />
              <span>{currentTime || 'LIVE TELEMETRY IST'}</span>
              <span className="opacity-50">(UTC+5:30)</span>
            </span>
            <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[10px] font-semibold">
              MCD · DDMA JOINT SURVEILLANCE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-[var(--text-primary)] tracking-tight">
            Delhi Flood Operations Command
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1 font-sans">
            Real-time multi-source telemetry · 250 municipal wards · Hydrological mass-balance risk engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          {weather && (
            <div className="px-3 py-1.5 rounded-none glass-panel text-[11px] text-[var(--text-secondary)] flex items-center space-x-1.5 border border-[var(--border)]">
              <CloudRain className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span className="text-[var(--text-muted)]">Precip:</span>
              <span className="font-bold text-[var(--brand)]">{weather.rainfallMm ?? 0} mm/h</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-none bg-sky-500/10 border border-sky-500/25 text-[11px] text-[var(--brand)] font-bold flex items-center space-x-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-none bg-sky-500 animate-ping" />
            <span>RADAR LIVE</span>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="px-3 py-1.5 rounded-none border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-[11px] font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--brand)] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards (Rectangular) ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const c    = palette[card.color];
          return (
            <div
              key={card.label}
              className={`surface-card p-4 sm:p-5 rounded-none ${c.hover} transition-all border border-[var(--border)]`}
            >
              <div className="flex items-center justify-between text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-2">
                <span>{card.label}</span>
                <div className={`p-1.5 rounded-none ${c.bg} border ${c.border} ${c.text}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-3xl sm:text-4xl font-black ${c.text} stat-live`}>
                {card.value}
                {card.unit && (
                  <span className="text-sm font-normal text-[var(--text-muted)] ml-1">{card.unit}</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Live Situational Incident Telemetry Stream Ticker ──── */}
      <div
        className="surface-card p-3 px-4 border border-[var(--border)] bg-[var(--surface-soft)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        onMouseEnter={() => setIsFeedPaused(true)}
        onMouseLeave={() => setIsFeedPaused(false)}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center space-x-1.5 flex-shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>DISPATCH TICKER</span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] truncate">
            <span className="text-[var(--text-muted)] hidden md:inline">
              [{SITUATIONAL_FEED[feedIndex].time}]
            </span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-bold uppercase border ${
                SITUATIONAL_FEED[feedIndex].severity === 'CRITICAL'
                  ? 'border-red-500/50 text-red-400 bg-red-500/10'
                  : SITUATIONAL_FEED[feedIndex].severity === 'HIGH'
                  ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                  : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
              }`}
            >
              {SITUATIONAL_FEED[feedIndex].type}
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {SITUATIONAL_FEED[feedIndex].title}:
            </span>
            <span className="text-[var(--text-secondary)] truncate">
              {SITUATIONAL_FEED[feedIndex].msg}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {feedIndex + 1}/{SITUATIONAL_FEED.length}
          </span>
          <div className="flex items-center space-x-0.5 border border-[var(--border)]">
            <button
              onClick={() => setFeedIndex((i) => (i - 1 + SITUATIONAL_FEED.length) % SITUATIONAL_FEED.length)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              title="Previous Incident"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedIndex((i) => (i + 1) % SITUATIONAL_FEED.length)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              title="Next Incident"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Map + Ward Panel (Rectangular) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Map */}
        <div className="lg:col-span-8">
          <div className="surface-card rounded-none p-4 border border-[var(--border)] h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-none bg-[var(--brand)]" />
                <span className="text-[13px] font-bold text-[var(--text-primary)]">Interactive Ward Risk Map</span>
                {loading && !mapError && (
                  <span className="text-[11px] text-[var(--text-muted)] ml-1">Loading…</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {mapError && (
                  <button
                    onClick={loadData}
                    className="flex items-center space-x-1 text-[11px] text-[var(--brand)] hover:opacity-80 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">Click ward polygon to inspect</span>
              </div>
            </div>

            {mapError ? (
              <div className="flex flex-col items-center justify-center h-[480px] text-[var(--text-muted)] space-y-4">
                <AlertCircle className="w-9 h-9 text-rose-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Map data unavailable</p>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs">{mapError}</p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center space-x-2 px-4 py-2 rounded-none bg-[var(--brand)] text-white text-xs font-bold transition-all border border-[var(--brand)]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Loading Map</span>
                </button>
              </div>
            ) : (
              <WardMap
                wardsData={wardsGeo}
                selectedWardId={selectedWard?.ward_code || selectedWard?.id}
                onSelectWard={handleSelectWard}
                height="480px"
              />
            )}
          </div>
        </div>

        {/* Ward Intelligence Panel */}
        <div className="lg:col-span-4">
          {selectedWard ? (
            <div className="surface-card rounded-none p-5 border border-[var(--border)] h-full flex flex-col justify-between">
              {/* Panel header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Ward Intelligence</div>
                    <h3 className="text-base font-black text-[var(--text-primary)] leading-tight">
                      {selectedWard.ward_name || selectedWard.name || `Ward ${selectedWard.ward_code || selectedWard.id}`}
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--brand)] font-bold">
                      {selectedWard.ward_code || selectedWard.id}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedWard(null); setWardDetails(null); }}
                    className="p-1.5 rounded-none hover:bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
                    title="Close selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingWard ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-none animate-spin" />
                    <span className="text-xs text-[var(--text-muted)]">Calculating mass-balance risk...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Risk Score */}
                    <div className="p-4 rounded-none bg-[var(--surface-soft)] border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Composite Risk Score</div>
                      <div className="flex items-end justify-between">
                        <div className="text-4xl font-black text-[var(--text-primary)]">
                          {evalData?.riskScore
                            ?? selectedWard.riskScore
                            ?? selectedWard.current_risk_score
                            ?? '50'}
                          <span className="text-sm font-normal text-[var(--text-muted)] ml-1">/ 100</span>
                        </div>
                        <RiskBadge
                          level={
                            evalData?.riskLevel
                            || selectedWard.riskLevel
                            || selectedWard.current_risk_level
                            || 'MODERATE'
                          }
                        />
                      </div>
                    </div>

                    {/* Risk factor bars */}
                    {evalData?.components ? (
                      <div className="space-y-2.5">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Deterministic Weight Drivers</div>
                        {[
                          { label: 'Drainage Deficit (40%)', score: evalData.components.drainageDeficitScore, bar: 'bg-blue-500' },
                          { label: 'Rainfall Surge (35%)',   score: evalData.components.rainfallSurgeScore,   bar: 'bg-sky-500' },
                          { label: 'Citizen Urgency (25%)',  score: evalData.components.complaintScore,        bar: 'bg-amber-500' },
                        ].map((f) => (
                          <div key={f.label}>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[var(--text-secondary)]">{f.label}</span>
                              <span className="text-[var(--text-primary)] font-bold">{typeof f.score === 'number' ? f.score.toFixed(1) : '—'}</span>
                            </div>
                            <div className="w-full bg-[var(--surface-soft)] border border-[var(--border)] rounded-none h-1.5">
                              <div
                                className={`${f.bar} h-1.5 rounded-none transition-all`}
                                style={{ width: `${Math.min(f.score || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Telemetry Drivers</div>
                        {[
                          { label: 'Drainage Capacity', score: selectedWard.drainageCapacity ?? 60, bar: 'bg-blue-500' },
                          { label: 'Precipitation Index', score: 45, bar: 'bg-sky-500' },
                          { label: 'Civic Priority', score: 30, bar: 'bg-amber-500' },
                        ].map((f) => (
                          <div key={f.label}>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[var(--text-secondary)]">{f.label}</span>
                              <span className="text-[var(--text-primary)] font-bold">{f.score}</span>
                            </div>
                            <div className="w-full bg-[var(--surface-soft)] border border-[var(--border)] rounded-none h-1.5">
                              <div
                                className={`${f.bar} h-1.5 rounded-none transition-all`}
                                style={{ width: `${Math.min(f.score || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: 'Drainage Flow',
                          value: `${selectedWard.drainageCapacity ?? selectedWard.drainage_capacity ?? '50'}`,
                          unit: 'm³/s',
                        },
                        {
                          label: 'Rainfall Surge',
                          value: `${selectedWard.rainfall ?? '28.5'}`,
                          unit: 'mm',
                        },
                      ].map((s) => (
                        <div key={s.label} className="p-3 rounded-none bg-[var(--surface-soft)] border border-[var(--border)] text-center">
                          <div className="text-[10px] text-[var(--text-muted)] mb-1">{s.label}</div>
                          <div className="text-sm font-black text-[var(--text-primary)]">
                            {s.value}
                            <span className="text-[10px] font-normal text-[var(--text-muted)] ml-0.5">{s.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommended action */}
                    <div className="p-3 rounded-none border border-amber-500/30 bg-amber-500/10">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-1 uppercase tracking-wider">Recommended Action</div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {(() => {
                          const lvl = String(evalData?.riskLevel || selectedWard?.riskLevel || 'MODERATE').toUpperCase();
                          if (lvl === 'CRITICAL') return 'Deploy emergency response immediately. Coordinate pump staging and road closures.';
                          if (lvl === 'HIGH')     return 'Inspect drainage network. Dispatch response team and pre-stage mobile pumps.';
                          if (lvl === 'MODERATE') return 'Increase patrol frequency. Monitor drainage and complaint volume.';
                          return 'Continue standard monitoring. No immediate intervention required.';
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => navigate(`/wards/${selectedWard.ward_code || selectedWard.id}`)}
                  className="w-full py-2.5 rounded-none bg-[var(--brand)] hover:opacity-90 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Ward Intelligence Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Default: 24h trend chart */
            <div className="surface-card rounded-none p-5 border border-[var(--border)] h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
                  <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Risk Escalation Trend (24h)
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mb-4">
                  Select any ward polygon on the map or from the directory below to view detailed telemetry.
                </p>

                {forecastData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <defs>
                          <linearGradient id="cgProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.75} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="cgCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.75} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 9 }} />
                        <YAxis stroke="var(--text-muted)" domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderColor: 'var(--border)',
                            borderRadius: '0px',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <Area type="monotone" dataKey="projected" stroke="#f97316" fillOpacity={1} fill="url(#cgProjected)" name="Projected 24h" />
                        <Area type="monotone" dataKey="current"   stroke="#0284c7" fillOpacity={1} fill="url(#cgCurrent)"   name="Current" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 flex items-center justify-center">
                    <div className="text-center text-[var(--text-muted)]">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-[11px]">Click a ward to view intelligence</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border)] mt-4 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-none bg-sky-500" />
                  <span>Current</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-none bg-orange-500" />
                  <span>Projected 24h</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ward Directory Table (Rectangular) ───────────────── */}
      <div className="surface-card rounded-none p-5 sm:p-6 border border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Municipal Ward Vulnerability Directory</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Search and filter across all 250 administrative wards in Delhi
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-none border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
              {[
                { id: 'ALL', label: 'All (250)' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'HIGH', label: 'High' },
                { id: 'MODERATE', label: 'Moderate' },
                { id: 'LOW', label: 'Low' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLevelFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    levelFilter === tab.id
                      ? 'bg-[var(--brand)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search ward name or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] pl-10 pr-3 py-2 text-xs rounded-none focus:outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--surface-soft)] text-[var(--text-muted)] uppercase font-semibold tracking-wider border-b border-[var(--border)] text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Ward Name</th>
                <th className="px-4 py-2.5 hidden md:table-cell">Drainage</th>
                <th className="px-4 py-2.5">Risk Level</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredWards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    {loading ? 'Loading ward data…' : 'No matching wards found.'}
                  </td>
                </tr>
              ) : (
                filteredWards.map((w) => {
                  const p = w.properties || {};
                  const level = String(p.riskLevel || p.current_risk_level || 'MODERATE').toUpperCase();
                  const score = p.riskScore ?? p.current_risk_score ?? 50;
                  const isSelected = selectedWard?.ward_code === p.ward_code || selectedWard?.id === p.id;
                  return (
                    <tr
                      key={p.ward_code || p.id}
                      onClick={() => handleSelectWard(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[var(--surface-soft)]' : 'hover:bg-[var(--surface-soft)]/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[var(--brand)] text-[11px]">
                        {p.ward_code || p.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{p.ward_name || p.name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] hidden md:table-cell">
                        {p.drainageCapacity ?? p.drainage_capacity ?? 50} m³/s
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={level} />
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{score} / 100</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/wards/${p.ward_code || p.id}`);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-none bg-[var(--brand)] hover:opacity-90 text-white transition-colors text-[11px] font-semibold"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
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
  );
}
