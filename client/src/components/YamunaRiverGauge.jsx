import React, { useState, useEffect, useMemo } from 'react';
import {
  Waves, AlertTriangle, ShieldCheck, Gauge, ArrowUpRight,
  TrendingUp, TrendingDown, RefreshCw, Sliders, Droplets,
  Activity, Compass, Info, Radio
} from 'lucide-react';

/**
 * YamunaRiverGauge — Real-Time Hydrological River Flow & Dynamic Flood Cross-Section.
 * Models Delhi's Old Railway Bridge (ORB) Yamuna water level, flow velocity,
 * Hathnikund Barrage discharge, and gravity storm outfall backflow threshold.
 */

// Official Central Water Commission (CWC) Delhi Benchmarks (in meters above MSL)
export const GAUGE_BENCHMARKS = {
  MIN_BED: 202.50,
  SAFE_BASELINE: 204.00,
  WARNING_MARK: 205.33,
  DANGER_MARK: 205.53,
  RECORD_CREST_2023: 208.66,
};

export default function YamunaRiverGauge({
  initialWaterLevel = 204.85,
  onWaterLevelChange = null,
  showSimulationControls = true,
  className = '',
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLevel, setSimulatedLevel] = useState(initialWaterLevel);
  const [waveOffset, setWaveOffset] = useState(0);

  // Sync when initialWaterLevel prop updates while not in manual simulation
  useEffect(() => {
    if (!isSimulating) {
      setSimulatedLevel(initialWaterLevel);
    }
  }, [initialWaterLevel, isSimulating]);

  // Notify parent of water level changes if callback provided
  useEffect(() => {
    if (onWaterLevelChange) {
      onWaterLevelChange(simulatedLevel);
    }
  }, [simulatedLevel, onWaterLevelChange]);

  // Subtle natural water oscillation
  useEffect(() => {
    const timer = setInterval(() => {
      setWaveOffset((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Compute Hydrological Derived Metrics based on stage-discharge physics
  const metrics = useMemo(() => {
    const level = Number(simulatedLevel);
    const dangerDiff = level - GAUGE_BENCHMARKS.DANGER_MARK;
    const warningDiff = level - GAUGE_BENCHMARKS.WARNING_MARK;

    // Severity category
    let status = 'SAFE';
    let statusColor = 'text-emerald-600 dark:text-emerald-400';
    let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
    let waveTheme = 'safe'; // 'safe' | 'warning' | 'danger' | 'critical'

    if (level >= GAUGE_BENCHMARKS.DANGER_MARK) {
      status = level >= 207.0 ? 'CATASTROPHIC FLOOD' : 'DANGER ZONE BREACHED';
      statusColor = 'text-rose-600 dark:text-rose-400';
      statusBg = 'bg-rose-500/15 border-rose-500/30';
      waveTheme = 'critical';
    } else if (level >= GAUGE_BENCHMARKS.WARNING_MARK) {
      status = 'WARNING STAGE ACTIVE';
      statusColor = 'text-amber-600 dark:text-amber-400';
      statusBg = 'bg-amber-500/15 border-amber-500/30';
      waveTheme = 'warning';
    } else if (level >= 204.50) {
      status = 'MODERATE SWELL';
      statusColor = 'text-sky-600 dark:text-sky-400';
      statusBg = 'bg-sky-500/10 border-sky-500/20';
      waveTheme = 'safe';
    }

    // Physical water height fill percentage (bounded 20% to 92% of UI cross-section)
    const normalizedHeight = Math.min(
      Math.max(
        ((level - GAUGE_BENCHMARKS.MIN_BED) / (GAUGE_BENCHMARKS.RECORD_CREST_2023 - GAUGE_BENCHMARKS.MIN_BED)) * 100,
        22
      ),
      95
    );

    // Flow velocity (m/s) modeled on Manning's formula for Yamuna channel
    const baselineVelocity = 1.35;
    const velocityFactor = Math.max(0, level - GAUGE_BENCHMARKS.SAFE_BASELINE) * 0.72;
    const velocity = (baselineVelocity + velocityFactor).toFixed(2);

    // Discharge in cusecs from Hathnikund Barrage (approximate rating curve)
    let dischargeCusecs;
    if (level < 204.50) {
      dischargeCusecs = Math.round(24000 + (level - 203.0) * 8000);
    } else if (level < GAUGE_BENCHMARKS.WARNING_MARK) {
      dischargeCusecs = Math.round(48000 + (level - 204.50) * 45000);
    } else if (level < GAUGE_BENCHMARKS.DANGER_MARK) {
      dischargeCusecs = Math.round(145000 + (level - GAUGE_BENCHMARKS.WARNING_MARK) * 280000);
    } else {
      dischargeCusecs = Math.round(210000 + (level - GAUGE_BENCHMARKS.DANGER_MARK) * 115000);
    }

    // Rate of Rise
    const isRising = level >= 204.80;
    const riseRate = isRising ? `+${((level - 204.0) * 1.8).toFixed(1)} cm/h` : `-0.6 cm/h`;

    // River Depth (bed to surface)
    const riverDepth = (level - GAUGE_BENCHMARKS.MIN_BED).toFixed(2);

    // Gravity Outfall Backflow Status for Delhi's major drains
    let outfallStatus;
    if (level >= GAUGE_BENCHMARKS.DANGER_MARK) {
      outfallStatus = {
        label: 'BACKFLOW CRITICAL',
        sub: 'Flap gates closed at Kashmere Gate, ITO Drain & Barapullah; pumping units active.',
        badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        critical: true,
      };
    } else if (level >= GAUGE_BENCHMARKS.WARNING_MARK) {
      outfallStatus = {
        label: 'BACKFLOW SURCHARGE RISK',
        sub: 'Gravity drainage impeded; secondary pumps on standby at low-lying culverts.',
        badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        critical: false,
      };
    } else {
      outfallStatus = {
        label: 'FREE GRAVITY DISCHARGE',
        sub: 'Natural gravity flow operating normally into Yamuna river basin.',
        badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        critical: false,
      };
    }

    // Animation speed for SVG waves (lower duration = faster torrent)
    const animationDuration = Math.max(1.8, (12 - Number(velocity) * 1.8)).toFixed(1);

    return {
      level,
      dangerDiff,
      warningDiff,
      status,
      statusColor,
      statusBg,
      waveTheme,
      normalizedHeight,
      velocity,
      dischargeCusecs,
      riseRate,
      isRising,
      riverDepth,
      outfallStatus,
      animationDuration,
    };
  }, [simulatedLevel]);

  // Wave gradient styles based on stage
  const waveColors = useMemo(() => {
    switch (metrics.waveTheme) {
      case 'critical':
        return {
          fillFront: 'rgba(239, 68, 68, 0.42)',
          fillMid: 'rgba(220, 38, 38, 0.65)',
          fillBack: 'rgba(185, 28, 28, 0.85)',
          glow: 'shadow-[0_-8px_30px_rgba(239,68,68,0.35)]',
          strokeColor: '#f87171',
        };
      case 'warning':
        return {
          fillFront: 'rgba(245, 158, 11, 0.40)',
          fillMid: 'rgba(217, 119, 6, 0.60)',
          fillBack: 'rgba(180, 83, 9, 0.85)',
          glow: 'shadow-[0_-8px_25px_rgba(245,158,11,0.25)]',
          strokeColor: '#fbbf24',
        };
      case 'safe':
      default:
        return {
          fillFront: 'rgba(56, 189, 248, 0.38)',
          fillMid: 'rgba(14, 165, 233, 0.60)',
          fillBack: 'rgba(2, 132, 199, 0.85)',
          glow: 'shadow-[0_-8px_25px_rgba(14,165,233,0.2)]',
          strokeColor: '#38bdf8',
        };
    }
  }, [metrics.waveTheme]);

  return (
    <div className={`surface-card rounded-xl border border-[var(--border)] overflow-hidden shadow-sm transition-all duration-300 ${className}`}>
      
      {/* ── Top Header & Live Telemetry HUD ─────────────────────────────────── */}
      <div className="p-3.5 sm:p-4 bg-[var(--surface-elevated)] border-b border-[var(--border)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* River Basin Title & Current Station */}
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-[var(--brand)] border border-sky-500/20 flex items-center justify-center shrink-0">
              <Waves className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
                  Yamuna River Hydrological Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border)]">
                  CWC STN: OLD RAILWAY BRIDGE (ORB)
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${metrics.statusBg} ${metrics.statusColor}`}>
                  {metrics.status}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Real-time river stage, water depth, flow speed, and storm drain outfall backflow monitoring.
              </p>
            </div>
          </div>

          {/* Mode Switcher: Live CWC vs What-If Flood Simulator */}
          {showSimulationControls && (
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  if (isSimulating) setSimulatedLevel(initialWaterLevel);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSimulating
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400'
                    : 'bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Toggle interactive flood level scrubber"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Simulation Mode Active' : 'What-If Scrubber'}</span>
              </button>

              {isSimulating && (
                <button
                  onClick={() => setSimulatedLevel(initialWaterLevel)}
                  className="p-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Reset to live telemetry baseline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Key Hydrological Metric Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 font-mono">
          
          {/* 1. Water Level */}
          <div className="p-2.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>WATER LEVEL (MSL)</span>
              <Gauge className="w-3 h-3 text-sky-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {metrics.level.toFixed(2)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">m</span>
            </div>
            <div className="text-[10px] flex items-center gap-1">
              {metrics.level >= GAUGE_BENCHMARKS.DANGER_MARK ? (
                <span className="text-rose-500 font-bold flex items-center">
                  +{metrics.dangerDiff.toFixed(2)}m above Danger
                </span>
              ) : metrics.level >= GAUGE_BENCHMARKS.WARNING_MARK ? (
                <span className="text-amber-500 font-semibold flex items-center">
                  +{metrics.warningDiff.toFixed(2)}m above Warning
                </span>
              ) : (
                <span className="text-emerald-500 font-semibold flex items-center">
                  {(GAUGE_BENCHMARKS.WARNING_MARK - metrics.level).toFixed(2)}m to Warning
                </span>
              )}
            </div>
          </div>

          {/* 2. Flow Velocity */}
          <div className="p-2.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>FLOW VELOCITY</span>
              <Compass className="w-3 h-3 text-cyan-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {metrics.velocity}
              </span>
              <span className="text-xs text-[var(--text-muted)]">m/s</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {Number(metrics.velocity) >= 3.0 ? (
                <span className="text-rose-500 font-semibold">High Torrent Surge</span>
              ) : Number(metrics.velocity) >= 2.0 ? (
                <span className="text-amber-500 font-semibold">Moderate Current</span>
              ) : (
                <span className="text-emerald-500 font-semibold">Laminar Base Flow</span>
              )}
            </div>
          </div>

          {/* 3. Water Depth */}
          <div className="p-2.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>RIVER DEPTH</span>
              <Droplets className="w-3 h-3 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {metrics.riverDepth}
              </span>
              <span className="text-xs text-[var(--text-muted)]">m</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Bed Elevation: 202.50m
            </div>
          </div>

          {/* 4. Hathnikund Barrage Discharge */}
          <div className="p-2.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>BARRAGE RELEASE</span>
              <Activity className="w-3 h-3 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {metrics.dischargeCusecs.toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">cusecs</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Hathnikund → Delhi (~48h)
            </div>
          </div>

          {/* 5. Rise Rate & Surge Status */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>RISE RATE (Δh/Δt)</span>
              {metrics.isRising ? (
                <TrendingUp className="w-3 h-3 text-rose-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${metrics.isRising ? 'text-rose-500' : 'text-emerald-500'}`}>
                {metrics.riseRate}
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              Trend: {metrics.isRising ? 'Escalating' : 'Steady'}
            </div>
          </div>

        </div>

        {/* ── Drainage Flap Gates / Backflow Warning Alert Banner ── */}
        <div className={`p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${metrics.outfallStatus.badge}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${metrics.outfallStatus.critical ? 'animate-bounce text-rose-500' : ''}`} />
            <div>
              <span className="font-bold tracking-wide">{metrics.outfallStatus.label}:</span>{' '}
              <span className="opacity-90">{metrics.outfallStatus.sub}</span>
            </div>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-semibold shrink-0">
            Kashmere Gate · ITO · Barapullah
          </span>
        </div>

        {/* ── Interactive Simulation Scrubber (Shown when What-If active) ── */}
        {isSimulating && (
          <div className="p-3.5 rounded-xl bg-[var(--surface-soft)] border border-amber-500/30 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)]">
                <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold">Hydrological Stress Simulation:</span>
                <span className="text-amber-500 font-semibold">{Number(simulatedLevel).toFixed(2)} m</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Slide to test river surge, flow velocity acceleration, and gate closures
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="203.00"
              max="208.66"
              step="0.05"
              value={simulatedLevel}
              onChange={(e) => setSimulatedLevel(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-[var(--border)] rounded-lg appearance-none"
            />

            {/* Quick Benchmark Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] font-mono">
              <span className="text-[var(--text-muted)] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setSimulatedLevel(204.00)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  simulatedLevel === 204.00
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Safe Base (204.00m)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLevel(204.85)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  simulatedLevel === 204.85
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Live Gauge (204.85m)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLevel(GAUGE_BENCHMARKS.WARNING_MARK)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  simulatedLevel === GAUGE_BENCHMARKS.WARNING_MARK
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Warning Mark (205.33m)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLevel(GAUGE_BENCHMARKS.DANGER_MARK)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  simulatedLevel === GAUGE_BENCHMARKS.DANGER_MARK
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Danger Mark (205.53m)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLevel(GAUGE_BENCHMARKS.RECORD_CREST_2023)}
                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  simulatedLevel === GAUGE_BENCHMARKS.RECORD_CREST_2023
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Record Crest 2023 (208.66m)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dynamic Flowing River Cross-Section Viewport ───────────────────── */}
      <div className="relative w-full h-44 sm:h-52 bg-gradient-to-b from-[var(--surface)] via-[var(--surface-soft)] to-[var(--surface-soft)] overflow-hidden select-none border-t border-[var(--border)]">
        
        {/* River Channel Bed & Levee Walls Background Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        {/* River Channel Embankment Side Guides */}
        <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-stone-800/20 dark:from-stone-900/50 to-transparent pointer-events-none border-r border-dashed border-[var(--border)]/60 flex flex-col justify-between py-2 pl-1 font-mono text-[9px] text-[var(--text-muted)]">
          <span>West Embankment</span>
          <span>(Civil Lines / Ring Rd)</span>
        </div>
        <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-stone-800/20 dark:from-stone-900/50 to-transparent pointer-events-none border-l border-dashed border-[var(--border)]/60 flex flex-col justify-between py-2 pr-1 text-right font-mono text-[9px] text-[var(--text-muted)]">
          <span>East Embankment</span>
          <span>(Trans-Yamuna)</span>
        </div>

        {/* ── Official Gauge Elevation Threshold Lines (Horizontal Guides) ── */}
        
        {/* 1. All-time Record Crest 2023 Line (208.66 m) */}
        <div className="absolute top-[8%] left-10 right-10 flex items-center gap-2 pointer-events-none">
          <div className="h-px flex-1 border-t border-dashed border-red-500/40" />
          <span className="font-mono text-[9px] text-red-500/70 shrink-0 bg-[var(--surface-elevated)]/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
            Historic 2023 Peak (208.66m)
          </span>
          <div className="h-px flex-1 border-t border-dashed border-red-500/40" />
        </div>

        {/* 2. Official Danger Mark (205.53 m) */}
        <div className="absolute top-[32%] left-10 right-10 flex items-center gap-2 pointer-events-none z-20">
          <div className="h-px flex-1 border-t border-dashed border-rose-500" />
          <span className="font-mono text-[9px] font-bold text-rose-500 shrink-0 bg-[var(--surface-elevated)] px-2 py-0.5 rounded border border-rose-500/40 shadow-xs">
            DANGER MARK (205.53m)
          </span>
          <div className="h-px flex-1 border-t border-dashed border-rose-500" />
        </div>

        {/* 3. Official Warning Mark (205.33 m) */}
        <div className="absolute top-[44%] left-10 right-10 flex items-center gap-2 pointer-events-none z-20">
          <div className="h-px flex-1 border-t border-dashed border-amber-500" />
          <span className="font-mono text-[9px] font-bold text-amber-500 shrink-0 bg-[var(--surface-elevated)] px-2 py-0.5 rounded border border-amber-500/40 shadow-xs">
            WARNING MARK (205.33m)
          </span>
          <div className="h-px flex-1 border-t border-dashed border-amber-500" />
        </div>

        {/* 4. Safe Baseline (204.00 m) */}
        <div className="absolute top-[75%] left-10 right-10 flex items-center gap-2 pointer-events-none opacity-60">
          <div className="h-px flex-1 border-t border-dotted border-emerald-500/50" />
          <span className="font-mono text-[9px] text-emerald-500 shrink-0">
            Safe Normal Flow (204.00m)
          </span>
          <div className="h-px flex-1 border-t border-dotted border-emerald-500/50" />
        </div>

        {/* ── Actual Flowing Real River (Multi-Layer Sinusoidal Waves) ── */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out ${waveColors.glow}`}
          style={{ height: `${metrics.normalizedHeight}%` }}
        >
          {/* Surface Indicator Bubble with Current Water Level */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] shadow-md font-mono text-[10px] text-[var(--text-primary)]">
            <span className={`w-2 h-2 rounded-full ${metrics.level >= GAUGE_BENCHMARKS.DANGER_MARK ? 'bg-rose-500 animate-ping' : metrics.level >= GAUGE_BENCHMARKS.WARNING_MARK ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'}`} />
            <span className="font-bold">CURRENT STAGE: {metrics.level.toFixed(2)} m</span>
            <span className="text-[var(--text-muted)]">({metrics.velocity} m/s)</span>
          </div>

          {/* SVG Multi-Layer Continuous Waves */}
          <div className="relative w-full h-full overflow-hidden">
            
            {/* Wave Layer 1: Deep Back Current (Slower) */}
            <svg
              className="absolute -top-5 left-0 w-[200%] h-12 pointer-events-none"
              style={{
                transform: `translateX(-${(waveOffset * 0.7) % 50}%)`,
                transition: 'transform 0.05s linear',
              }}
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C150,50 350,10 500,40 C650,70 850,20 1000,50 C1150,80 1200,30 1200,30 L1200,120 L0,120 Z"
                fill={waveColors.fillBack}
              />
            </svg>

            {/* Wave Layer 2: Mid-Level Body Wave (Moderate) */}
            <svg
              className="absolute -top-6 left-0 w-[200%] h-14 pointer-events-none"
              style={{
                transform: `translateX(-${(waveOffset * 1.2 + 25) % 50}%)`,
                transition: 'transform 0.05s linear',
              }}
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,20 C200,70 400,10 600,45 C800,80 1000,20 1200,50 L1200,120 L0,120 Z"
                fill={waveColors.fillMid}
              />
            </svg>

            {/* Wave Layer 3: Surface Wave with Froth Ripple (Fastest) */}
            <svg
              className="absolute -top-7 left-0 w-[200%] h-16 pointer-events-none"
              style={{
                transform: `translateX(-${(waveOffset * 1.8 + 60) % 50}%)`,
                transition: 'transform 0.05s linear',
              }}
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,35 C150,10 350,65 500,30 C650,5 850,55 1000,25 C1150,0 1200,40 1200,40 L1200,120 L0,120 Z"
                fill={waveColors.fillFront}
                stroke={waveColors.strokeColor}
                strokeWidth="1.5"
              />
            </svg>

            {/* Deep Water Column Fill Gradient */}
            <div
              className="absolute top-6 bottom-0 left-0 right-0 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, ${waveColors.fillBack}, rgba(2, 6, 23, 0.92))`,
              }}
            />

            {/* Submerged Sediment Turbulence Flow Lines (Shows river speed) */}
            <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
              <div 
                className="w-full h-full flex flex-col justify-around"
                style={{
                  animation: `riverFlow ${metrics.animationDuration}s linear infinite`,
                }}
              >
                <div className="w-24 h-0.5 bg-white/40 rounded-full ml-12 animate-pulse" />
                <div className="w-32 h-0.5 bg-white/30 rounded-full ml-64" />
                <div className="w-20 h-0.5 bg-white/40 rounded-full ml-36" />
                <div className="w-40 h-0.5 bg-white/20 rounded-full ml-80" />
              </div>
            </div>

          </div>
        </div>

        {/* River Bed Gravel & Sediment Base Strip */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-stone-900 border-t border-stone-700/80 flex items-center justify-between px-3 text-[8px] font-mono text-stone-400 select-none z-30">
          <span>RIVER BED: YAMUNA BASIN (ALLUVIAL SILT)</span>
          <span>GEODETIC DATUM: SRID 4326 · WGS84</span>
        </div>

      </div>

      {/* ── Footer Status Summary Bar ───────────────────────────────────────── */}
      <div className="px-3.5 py-2.5 bg-[var(--surface-elevated)] border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${metrics.level >= GAUGE_BENCHMARKS.DANGER_MARK ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
          <span>Automatic Telemetry Refresh · Updated every 60s via CWC Hydro-Net</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Old Railway Bridge: <strong className="text-[var(--text-secondary)]">{metrics.level.toFixed(2)}m</strong></span>
          <span>·</span>
          <span>Hathnikund: <strong className="text-[var(--text-secondary)]">{metrics.dischargeCusecs.toLocaleString()} cfs</strong></span>
        </div>
      </div>

    </div>
  );
}
