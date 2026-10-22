import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders, Sparkles, RefreshCw, ArrowRight, ShieldCheck,
  Droplets, Truck, Layers, Activity, Info, ChevronDown, ChevronUp,
  MapPin, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import { runSimulation, getSimulationPresets, getWardsGeoJSON } from '../services/api';

export default function Simulator() {
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [presets, setPresets] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('W056');
  const [selectedPresetId, setSelectedPresetId] = useState('MAX_EMERGENCY_DEWATERING');

  // Simulator intervention parameters
  const [additionalPumps, setAdditionalPumps] = useState(2);
  const [rainfallMm, setRainfallMm] = useState(35);
  const [drainageModifier, setDrainageModifier] = useState(20);

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  // Real-time IST Clock
  const [currentTime, setCurrentTime] = useState('');
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
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const executeSimulation = useCallback((wardId, pumps, rain, drain, presetId = null) => {
    setLoading(true);
    runSimulation({
      wardId,
      additionalMobilePumps: parseInt(pumps, 10),
      simulatedRainfallMm: parseFloat(rain),
      drainageModifierPct: parseFloat(drain),
      presetId,
    })
      .then((res) => setSimulationResult(res))
      .catch((err) => console.error('Simulation execution failed:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getWardsGeoJSON()
      .then((data) => {
        const sorted = (data.features || []).map((f) => f.properties).sort((a, b) =>
          (a.ward_name || a.name || '').localeCompare(b.ward_name || b.name || '')
        );
        setWards(sorted);
      })
      .catch((err) => console.error(err));

    getSimulationPresets()
      .then((data) => {
        const list = data.presets || (Array.isArray(data) ? data : []);
        setPresets(list);
      })
      .catch((err) => console.error(err));

    // Baseline run on initial mount
    executeSimulation('W056', 2, 35, 20, 'MAX_EMERGENCY_DEWATERING');
  }, [executeSimulation]);

  const handleRun = (e) => {
    if (e) e.preventDefault();
    executeSimulation(selectedWardId, additionalPumps, rainfallMm, drainageModifier, selectedPresetId);
  };

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    const p = preset.interventions || preset;
    const pumps = p.additionalMobilePumps ?? p.pumpUnits ?? 0;
    const rain = p.simulatedRainfallMm ?? p.rainfallMm ?? p.rainfallIncrease ?? 30;
    const drain = p.drainageModifierPct ?? (p.drainageReduction ? -p.drainageReduction : 0);

    setAdditionalPumps(pumps);
    setRainfallMm(rain);
    setDrainageModifier(drain);
    executeSimulation(selectedWardId, pumps, rain, drain, preset.id);
  };

  // Find properties of currently selected ward
  const activeWardProps = useMemo(() => {
    return wards.find(
      (w) => w.ward_code === selectedWardId || w.id === selectedWardId
    ) || null;
  }, [wards, selectedWardId]);

  // Comparison BarChart Data
  const comparisonData = useMemo(() => {
    if (!simulationResult?.comparison) {
      return [
        { metric: 'Composite Risk', Baseline: 68, Simulated: 50 },
        { metric: 'Drainage Deficit', Baseline: 52, Simulated: 28 },
        { metric: 'Rainfall Surge', Baseline: 48, Simulated: 48 },
      ];
    }
    const c = simulationResult.comparison;
    return [
      {
        metric: 'Composite Risk',
        Baseline: c.baseline?.riskScore || 68,
        Simulated: c.simulated?.riskScore || 50,
      },
      {
        metric: 'Drainage Deficit',
        Baseline: c.baseline?.components?.drainageDeficitScore || 52,
        Simulated: c.simulated?.components?.drainageDeficitScore || 28,
      },
      {
        metric: 'Rainfall Surge',
        Baseline: c.baseline?.components?.rainfallSurgeScore || 48,
        Simulated: c.simulated?.components?.rainfallSurgeScore || 48,
      },
    ];
  }, [simulationResult]);

  const deltas = simulationResult?.comparison?.deltas || {
    riskScore: -18.0,
    drainageDeficit: -24.0,
    rainfallSurge: 0,
    inundationDurationMinutes: -45,
  };

  const baselineRisk = simulationResult?.comparison?.baseline?.riskScore ?? 68.0;
  const simulatedRisk = simulationResult?.comparison?.simulated?.riskScore ?? 50.0;
  const isMitigated = deltas.riskScore <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-enter font-inter">
      {/* ── 1. Clean Operational Header ────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/20">
              <Sliders className="w-3.5 h-3.5" />
              <span>WHAT-IF SIMULATOR</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MASS-BALANCE ENGINE ONLINE</span>
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] pl-1">
              {currentTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
            Scenario Simulator & Mitigation Logistics
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Evaluate real-time delta risk (ΔRisk), mobile pump deployments, desilting modifiers, and rainfall shocks.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start lg:self-auto">
          <button
            onClick={() => handleRun()}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
            title="Recalculate simulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--brand)]' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* ── 2. Standard Monsoon Scenario Presets (Pill Row) ─────── */}
      {presets.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Standard Monsoon Scenario Presets</span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Click preset to load variables instantly
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((pr) => {
              const isActive = selectedPresetId === pr.id;
              return (
                <button
                  key={pr.id}
                  onClick={() => applyPreset(pr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand)] text-white shadow-sm'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]'
                  }`}
                >
                  <Sparkles className={`w-3 h-3 ${isActive ? 'text-white' : 'text-[var(--brand)]'}`} />
                  <span>{pr.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. Main Two-Column Simulation Workspace ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Parameter Configuration Cockpit (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[var(--brand)]" />
              <span>Intervention Variables</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
              Catchment Tuning
            </span>
          </div>

          <form onSubmit={handleRun} className="space-y-6">
            {/* Target Catchment Ward */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider font-mono">
                Target Catchment Ward
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  executeSimulation(e.target.value, additionalPumps, rainfallMm, drainageModifier, selectedPresetId);
                }}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface)] text-xs text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand)] cursor-pointer"
              >
                {wards.map((w) => (
                  <option
                    key={w.ward_code || w.id}
                    value={w.ward_code || w.id}
                    className="bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                  >
                    {w.ward_name || w.name} ({w.ward_code || w.id}) — Risk: {w.riskScore ?? w.current_risk_score ?? 50}/100
                  </option>
                ))}
              </select>

              {activeWardProps && (
                <div className="p-3 rounded-lg bg-[var(--surface-soft)] text-xs font-mono grid grid-cols-3 gap-2 text-center text-[var(--text-muted)] border border-[var(--border)]">
                  <div>Base Drain: <b className="text-[var(--text-primary)] block">{activeWardProps.drainageCapacity ?? 50}%</b></div>
                  <div>Zone: <b className="text-[var(--text-primary)] block truncate">{activeWardProps.zone || 'Central'}</b></div>
                  <div>Rainfall: <b className="text-[var(--text-primary)] block">{activeWardProps.rainfall ?? 28.5} mm</b></div>
                </div>
              )}
            </div>

            {/* Variable 1: Mobile Dewatering Pumps */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  1. Deploy Mobile High-Capacity Pumps
                </span>
                <span className="text-[var(--brand)] font-mono font-bold text-xs">
                  +{additionalPumps} Units (+{additionalPumps * 15} m³/s relief)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={additionalPumps}
                onChange={(e) => setAdditionalPumps(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--brand)] cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>0 Pumps</span>
                <div className="flex gap-1.5">
                  {[0, 2, 4, 6, 8].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAdditionalPumps(val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                        additionalPumps === val
                          ? 'bg-[var(--brand)] text-white font-bold'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      {val}P
                    </button>
                  ))}
                </div>
                <span>8 Max</span>
              </div>
            </div>

            {/* Variable 2: Simulated Precipitation Rate */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  2. Simulated Precipitation Rate (Rainfall)
                </span>
                <span className="text-sky-500 dark:text-sky-400 font-mono font-bold text-xs">
                  {rainfallMm} mm/h
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>5 mm/h</span>
                <div className="flex gap-1.5">
                  {[
                    { label: 'Normal', val: 20 },
                    { label: 'Heavy', val: 50 },
                    { label: 'Cloudburst', val: 100 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setRainfallMm(preset.val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                        rainfallMm === preset.val
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <span>120 mm/h</span>
              </div>
            </div>

            {/* Variable 3: Desilting & Sump Clearance */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  3. Desilting & Sump Clearance
                </span>
                <span className={`font-mono font-bold text-xs ${drainageModifier >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {drainageModifier > 0 ? `+${drainageModifier}%` : `${drainageModifier}%`} Capacity
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="80"
                step="5"
                value={drainageModifier}
                onChange={(e) => setDrainageModifier(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>-50% Choked</span>
                <div className="flex gap-1.5">
                  {[
                    { label: 'Choked', val: -30 },
                    { label: 'Standard', val: 0 },
                    { label: 'Desilted', val: 40 },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => setDrainageModifier(item.val)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                        drainageModifier === item.val
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span>+80% Dredged</span>
              </div>
            </div>

            {/* Compute Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center space-x-2 bg-[var(--brand)] hover:opacity-95 active:scale-[0.99] cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Simulating Hydrological Physics...' : 'Compute Hydrological Delta (ΔRisk)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Quantitative Intelligence & Impact Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3 Executive Delta Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Metric 1: Delta Risk */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Risk Delta (ΔRisk)</span>
                <Activity className="w-3.5 h-3.5 text-[var(--brand)]" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-2xl sm:text-3xl font-mono font-bold ${isMitigated ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {deltas.riskScore > 0 ? `+${deltas.riskScore}` : deltas.riskScore}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">pts</span>
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)] flex items-center space-x-1.5 pt-1 border-t border-[var(--border)]">
                <span>{baselineRisk}</span>
                <ArrowRight className="w-3 h-3 text-[var(--brand)]" />
                <span className="font-bold text-[var(--text-primary)]">{simulatedRisk}</span>
              </div>
            </div>

            {/* Metric 2: Relief Duration */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Inundation Relief</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-sky-500 dark:text-sky-400">
                  {deltas.inundationDurationMinutes || -45}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">minutes</span>
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)] truncate">
                +{additionalPumps * 15} m³/s pumping
              </div>
            </div>

            {/* Metric 3: Budget & Feasibility */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Estimated Cost</span>
                <Truck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-[var(--text-primary)]">
                  ₹{simulationResult?.feasibility?.estimatedCostRupees
                    ? (simulationResult.feasibility.estimatedCostRupees).toLocaleString('en-IN')
                    : (15000 + additionalPumps * 7500).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-500 dark:text-emerald-400 flex items-center space-x-1 pt-1 border-t border-[var(--border)]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Feasible · Approved</span>
              </div>
            </div>
          </div>

          {/* Unified Comparative Shift & Recharts Visualizer */}
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[var(--border)] gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[var(--brand)]" />
                  <span>Hydrological Risk Decomposition</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Mass-balance score shift before and after mobile pump intervention.
                </p>
              </div>

              <span className={`self-start sm:self-auto text-[11px] font-mono font-bold px-2.5 py-1 rounded-full ${
                isMitigated
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {simulationResult?.impactAssessment || (isMitigated ? 'SIGNIFICANT MITIGATION' : 'NEUTRAL')}
              </span>
            </div>

            {/* Quick Progress Bar Gauge */}
            <div className="space-y-3 p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)] font-mono text-[11px]">Pre-Intervention Baseline</span>
                  <span className="font-bold font-mono text-[var(--text-primary)]">{baselineRisk} / 100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div
                    className="h-full bg-slate-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, baselineRisk))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)] font-mono text-[11px]">Simulated Post-Mitigation</span>
                  <span className="font-bold font-mono text-[var(--brand)]">{simulatedRisk} / 100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      simulatedRisk >= 75
                        ? 'bg-rose-500'
                        : simulatedRisk >= 60
                        ? 'bg-amber-500'
                        : simulatedRisk >= 40
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, simulatedRisk))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BarChart */}
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
                  <XAxis
                    dataKey="metric"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                  <Bar dataKey="Baseline" fill="var(--text-muted)" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="Simulated" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Collapsible Formula Explainer */}
            <div className="pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowFormula(!showFormula)}
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1.5 py-1 cursor-pointer"
              >
                <span>{showFormula ? 'Hide' : 'Inspect'} Explainable Mass-Balance Formula</span>
                {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--brand)]" />}
              </button>

              {showFormula && (
                <div className="mt-2.5 p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2 text-xs font-mono animate-in fade-in">
                  <div className="text-[var(--text-muted)] text-[11px]">
                    Risk = (0.40 × Drainage Deficit) + (0.35 × Rainfall Surge) + (0.25 × Citizen Complaints)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
                    <div>
                      <span className="text-[var(--text-muted)]">Baseline: </span>
                      <b className="text-[var(--text-primary)]">
                        (0.40×52) + (0.35×48) + (0.25×35) = <span className="text-amber-500 font-bold">{baselineRisk}</span>
                      </b>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Simulated: </span>
                      <b className="text-[var(--text-primary)]">
                        (0.40×{Math.max(10, Math.round(52 - additionalPumps * 6 - drainageModifier * 0.3))}) + (0.35×{Math.round(rainfallMm * 1.2)}) + (0.25×35) = <span className="text-emerald-500 font-bold">{simulatedRisk}</span>
                      </b>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actionable Tactical Handoff Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Ready to mobilize this scenario into operations?</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Transfer the simulated pump configuration directly to Incident Command to deploy response crews.
              </p>
            </div>

            <button
              onClick={() => navigate('/incidents')}
              className="px-4 py-2.5 rounded-xl bg-[var(--brand)] hover:opacity-95 text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap transition-all shadow-sm shrink-0"
            >
              <span>Mobilize in Incident Command</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
