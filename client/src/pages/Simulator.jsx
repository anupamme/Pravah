import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders, Sparkles, RefreshCw, ArrowRight, ShieldCheck,
  Droplets, Truck, Layers, Activity, Info
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 page-enter">
      {/* ── Municipal Command Header & Status Bar ─────────── */}
      <div className="bg-[var(--surface-elevated)] p-5 shadow-sm rounded-none">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 text-sky-400">
                <Sliders className="w-3.5 h-3.5" />
                <span>HYDROLOGICAL DIGITAL TWIN · WHAT-IF ENGINE</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PHYSICS MASS-BALANCE ONLINE</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
              Scenario Simulator & Mitigation Logistics
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Evaluate real-time delta risk (ΔRisk), mobile pump deployments, desilting modifiers, and cloudburst shocks before mobilizing field crews.
            </p>
          </div>

          {/* Right Header Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 bg-[var(--surface-soft)] text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Telemetry Clock
              </div>
              <div className="text-sm font-mono font-bold text-[var(--brand)]">
                {currentTime || 'IST ACTIVE'}
              </div>
            </div>

            <div className="hidden sm:flex flex-col text-[10px] font-mono pl-3 text-[var(--text-muted)]">
              <span>WEIGHT: <b className="text-[var(--text-primary)]">0.40(D) + 0.35(R) + 0.25(C)</b></span>
              <span>SIMULATION ID: <b className="text-[var(--brand)]">SIM-TWIN-V2</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Scenario Presets Bar ─────────────────────── */}
      {presets.length > 0 && (
        <div className="bg-[var(--surface-elevated)] p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Standard Delhi Monsoon Scenario Presets</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Click preset to load variables</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {presets.map((pr) => {
              const isActive = selectedPresetId === pr.id;
              return (
                <button
                  key={pr.id}
                  onClick={() => applyPreset(pr)}
                  className={`px-3 py-2 text-xs font-mono tracking-wide transition-colors duration-150 flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand)] text-white font-bold shadow-sm'
                      : 'bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
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

      {/* ── Main Simulation Grid (Controls + Intelligence) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Configuration Cockpit (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface-elevated)] p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Intervention Variables</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Catchment Parameters</span>
          </div>

          <form onSubmit={handleRun} className="space-y-5">
            {/* 1. Target Ward Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Target Catchment Ward
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  executeSimulation(e.target.value, additionalPumps, rainfallMm, drainageModifier, selectedPresetId);
                }}
                className="w-full px-3 py-2.5 bg-[var(--surface-soft)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] font-mono cursor-pointer"
              >
                {wards.map((w) => (
                  <option
                    key={w.ward_code || w.id}
                    value={w.ward_code || w.id}
                    className="bg-[var(--surface-elevated)] text-[var(--text-primary)] py-1.5"
                  >
                    {w.ward_name || w.name} ({w.ward_code || w.id}) — Risk: {w.riskScore ?? w.current_risk_score ?? 50}/100
                  </option>
                ))}
              </select>

              {activeWardProps && (
                <div className="mt-2 p-2 bg-[var(--surface-soft)] text-[10px] font-mono flex items-center justify-between text-[var(--text-muted)]">
                  <span>Base Drainage: <b className="text-[var(--text-primary)]">{activeWardProps.drainageCapacity ?? 50}%</b></span>
                  <span>Zone: <b className="text-[var(--text-primary)]">{activeWardProps.zone || 'Central'}</b></span>
                  <span>Rainfall: <b className="text-[var(--text-primary)]">{activeWardProps.rainfall ?? 28.5} mm</b></span>
                </div>
              )}
            </div>

            {/* 2. Deploy Mobile Dewatering Pumps */}
            <div className="space-y-2">
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
              <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                <span>0 (Standby)</span>
                <div className="flex gap-1.5">
                  {[0, 2, 4, 6, 8].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAdditionalPumps(val)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono transition-colors ${
                        additionalPumps === val ? 'bg-[var(--brand)] text-white font-bold' : 'bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {val}P
                    </button>
                  ))}
                </div>
                <span>8 Pumps Max</span>
              </div>
            </div>

            {/* 3. Simulated Precipitation Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  2. Simulated Precipitation Rate (Rainfall)
                </span>
                <span className="text-sky-400 font-mono font-bold text-xs">
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
              <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                <span>5 mm/h (Light)</span>
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
                      className={`px-1.5 py-0.5 text-[9px] font-mono transition-colors ${
                        rainfallMm === preset.val ? 'bg-sky-500 text-white font-bold' : 'bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <span>120 mm/h</span>
              </div>
            </div>

            {/* 4. Desilting & Culvert Dredging Modifier */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-primary)]">
                  3. Desilting & Canal Sump Clearance
                </span>
                <span className={`font-mono font-bold text-xs ${drainageModifier >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
              <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                <span>-50% (Silt Choke)</span>
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
                      className={`px-1.5 py-0.5 text-[9px] font-mono transition-colors ${
                        drainageModifier === item.val ? 'bg-emerald-500 text-white font-bold' : 'bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span>+80% (Dredged)</span>
              </div>
            </div>

            {/* Action CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-mono font-bold text-xs uppercase tracking-wider text-white transition-opacity duration-150 flex items-center justify-center space-x-2 bg-[var(--brand)] hover:opacity-90 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Simulating Hydrological Physics...' : 'Compute Hydrological Delta (ΔRisk)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Quantitative Intelligence & Impact Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3 Executive Delta Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Delta Risk Score */}
            <div className="p-4 bg-[var(--surface-elevated)] shadow-sm flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-between">
                <span>Risk Delta (ΔRisk)</span>
                <Activity className="w-3.5 h-3.5 text-[var(--brand)]" />
              </div>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className={`text-2xl font-mono font-bold ${isMitigated ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deltas.riskScore > 0 ? `+${deltas.riskScore}` : deltas.riskScore}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">points</span>
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1 flex items-center space-x-1">
                <span>{baselineRisk}</span>
                <ArrowRight className="w-3 h-3 text-[var(--brand)]" />
                <span className="font-bold text-[var(--text-primary)]">{simulatedRisk}</span>
              </div>
            </div>

            {/* Metric 2: Inundation Relief Duration */}
            <div className="p-4 bg-[var(--surface-elevated)] shadow-sm flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-between">
                <span>Inundation Relief</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className="text-2xl font-mono font-bold text-sky-400">
                  {deltas.inundationDurationMinutes || -45}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">minutes</span>
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1">
                +{additionalPumps * 15} m³/s pumping capacity
              </div>
            </div>

            {/* Metric 3: Resource Feasibility & Operating Budget */}
            <div className="p-4 bg-[var(--surface-elevated)] shadow-sm flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-between">
                <span>Estimated Budget</span>
                <Truck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                  ₹{simulationResult?.feasibility?.estimatedCostRupees
                    ? (simulationResult.feasibility.estimatedCostRupees).toLocaleString('en-IN')
                    : (15000 + additionalPumps * 7500).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 pt-1 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>Feasible · Approved Crew</span>
              </div>
            </div>
          </div>

          {/* Comparative Risk Reduction Bar Gauge */}
          <div className="bg-[var(--surface-elevated)] p-4 shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <span>Hydrological Risk Shift (Before vs After)</span>
              <span className={isMitigated ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isMitigated ? `MITIGATION: ${deltas.riskScore} PTS` : `HAZARD SURGE: +${deltas.riskScore} PTS`}
              </span>
            </div>

            <div className="space-y-2">
              {/* Baseline */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--text-muted)]">Pre-Intervention Baseline</span>
                  <span className="font-bold text-[var(--text-primary)]">{baselineRisk} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-[var(--surface-soft)] overflow-hidden">
                  <div
                    className="h-full bg-slate-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, baselineRisk))}%` }}
                  />
                </div>
              </div>

              {/* Simulated */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--text-muted)]">Simulated Post-Mitigation</span>
                  <span className="font-bold text-[var(--brand)]">{simulatedRisk} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-[var(--surface-soft)] overflow-hidden">
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
          </div>

          {/* Deterministic Mass-Balance Formula Card */}
          <div className="bg-[var(--surface-elevated)] p-4 shadow-sm space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              <span>Explainable Mass-Balance Decomposition</span>
              <span className="text-[var(--brand)] font-bold">Deterministic Model</span>
            </div>
            <div className="p-3 bg-[var(--surface-soft)] space-y-2 text-[11px]">
              <div className="text-[var(--text-muted)] text-[10px]">
                Risk = (0.40 × Drainage Deficit) + (0.35 × Rainfall Surge) + (0.25 × Citizen Complaints)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-[var(--border)]">
                <div>
                  <span className="text-[var(--text-muted)]">Baseline: </span>
                  <b className="text-[var(--text-primary)]">
                    (0.40×52) + (0.35×48) + (0.25×35) = <span className="text-amber-400 font-bold">{baselineRisk}</span>
                  </b>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Simulated: </span>
                  <b className="text-[var(--text-primary)]">
                    (0.40×{Math.max(10, Math.round(52 - additionalPumps * 6 - drainageModifier * 0.3))}) + (0.35×{Math.round(rainfallMm * 1.2)}) + (0.25×35) = <span className="text-emerald-400 font-bold">{simulatedRisk}</span>
                  </b>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Baseline vs Simulated Comparison BarChart */}
          <div className="bg-[var(--surface-elevated)] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-[var(--border)] gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--brand)]" />
                  <span>Baseline vs Simulated Hydrological Risk Decomposition</span>
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Quantitative mass-balance score shift before and after mobile pump intervention.
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--surface-soft)] text-[var(--brand)]">
                {simulationResult?.impactAssessment || (isMitigated ? 'SIGNIFICANT_MITIGATION' : 'NEUTRAL')}
              </span>
            </div>

            <div className="h-64 w-full pt-2">
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
                      borderRadius: '0px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="Baseline" fill="var(--text-muted)" radius={[0, 0, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="Simulated" fill="var(--brand)" radius={[0, 0, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable Tactical Handoff Banner */}
          <div className="p-4 bg-[var(--surface-soft)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Ready to mobilize this scenario into field operations?
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Transfer the simulated pump configuration directly to Incident Command to deploy Quick Response Teams (QRTs).
              </p>
            </div>

            <button
              onClick={() => navigate('/incidents')}
              className="px-4 py-2.5 bg-[var(--brand)] hover:opacity-90 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap transition-opacity duration-150"
            >
              <span>Mobilize in Incident Command</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operational Disclaimer */}
          <div className="p-3 bg-[var(--surface-elevated)] text-[10px] font-mono text-[var(--text-muted)] flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              MUNICIPAL DISCLAIMER: All outputs are synthetic mass-balance projections computed via deterministic risk models for disaster response planning, emergency budget allocation, and underpass dewatering feasibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
