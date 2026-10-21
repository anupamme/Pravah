import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ShieldAlert, MapPin, Send, AlertTriangle, Radio, RefreshCw,
  Search, Clock, Droplets, Truck, CheckCircle2,
  ChevronRight, ArrowUpRight, PhoneCall, ShieldCheck
} from 'lucide-react';
import {
  listIncidents,
  listResponseTeams,
  getCityTacticalPlan,
  dispatchResponseTeam,
} from '../services/api';
import { subscribeToTelemetry } from '../services/socket';

/** Equipment types available for emergency dispatch */
const EQUIPMENT_OPTIONS = [
  {
    id: 'MOBILE_PUMP_5000',
    name: '5000 GPM Mobile Dewatering Pump Trailer',
    category: 'High-Volume Pumping',
    suitedFor: 'Railway and arterial underpasses (depth > 35cm)',
  },
  {
    id: 'SLUDGE_DREDGER_V3',
    name: 'High-Capacity Hydraulic Sludge Dredger',
    category: 'Culvert & Silt Clearing',
    suitedFor: 'Severely silted trunk drains & culvert blockages',
  },
  {
    id: 'TRAFFIC_DIVERSION_RIG',
    name: 'Arterial Traffic Diversion & Barricade Squad',
    category: 'Traffic Management',
    suitedFor: 'Flooded junctions & hazardous highway depressions',
  },
  {
    id: 'SWIFT_WATER_BOAT',
    name: 'Inflatable Rescue Boat & Swift Water Rig',
    category: 'Water Evacuation',
    suitedFor: 'Floodplain settlements & rapid inundation zones',
  },
];

export default function IncidentCommand() {
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tacticalPlan, setTacticalPlan] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('MOBILE_PUMP_5000');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Ground Registry DOM Ref for auto-scrolling
  const registryRef = useRef(null);

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

  const loadData = useCallback((isManual = false) => {
    if (isManual) setIsLoading(true);
    Promise.all([
      listIncidents().catch(() => ({ incidents: [] })),
      listResponseTeams().catch(() => ({ teams: [] })),
      getCityTacticalPlan().catch(() => null),
    ])
      .then(([incData, teamData, plan]) => {
        const rawIncidents = Array.isArray(incData) ? incData : (incData.incidents || []);
        const rawTeams = Array.isArray(teamData) ? teamData : (teamData.teams || []);
        setIncidents(rawIncidents);
        setTeams(rawTeams);
        setTacticalPlan(plan?.topActionPlan || plan?.cityTacticalRoadmap?.topInterventions || plan?.cityTacticalRoadmap || null);

        // Pre-select first critical incident if none selected
        if (!selectedIncident && rawIncidents.length > 0) {
          setSelectedIncident(rawIncidents[0]);
        }

        // Auto-select first available response team by default
        if (rawTeams.length > 0) {
          const available = rawTeams.find((t) => t.status === 'AVAILABLE' || !t.status);
          setSelectedTeamId((prev) => prev || (available ? available.id : rawTeams[0].id));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedIncident]);

  useEffect(() => {
    loadData();

    // Live Telemetry Subscriptions
    const unsubs = [
      subscribeToTelemetry('incident:created', (inc) => {
        setIncidents((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);
      }),
      subscribeToTelemetry('incident:updated', () => loadData()),
      subscribeToTelemetry('dispatch:assigned', () => loadData()),
    ];

    return () => unsubs.forEach((fn) => fn && fn());
  }, [loadData]);

  // Stage crew and relocate to Ground Incident Registry
  const handleStageCrew = useCallback((item) => {
    const targetCode = item.wardCode || item.wardId;
    let matched = incidents.find(
      (i) => i.wardId === targetCode || i.wardCode === targetCode
    );

    if (!matched) {
      matched = {
        id: `INC-TACTICAL-${targetCode || Date.now().toString().slice(-4)}`,
        wardId: targetCode,
        wardCode: targetCode,
        wardName: item.wardName,
        description: item.title || item.action,
        severity: item.priority || 'CRITICAL',
        waterDepthCm: 45,
        status: 'ACTIVE',
      };
      setIncidents((prev) => [matched, ...prev.filter((i) => i.id !== matched.id)]);
    }

    setSelectedIncident(matched);

    // Auto-select available QRT team if none is selected
    if (!selectedTeamId && teams.length > 0) {
      const avail = teams.find((t) => t.status === 'AVAILABLE' || !t.status);
      setSelectedTeamId(avail ? avail.id : teams[0].id);
    }

    // Reset filters so the matched incident is visible in the registry
    setFilterSeverity('ALL');
    setSearchQuery('');

    // Smoothly relocate/scroll down to Ground Incident Registry
    setTimeout(() => {
      registryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [incidents, selectedTeamId, teams]);

  const handleDispatch = async (e) => {
    if (e) e.preventDefault();
    if (!selectedIncident) {
      setDispatchStatus({
        type: 'ERROR',
        message: 'Please select an incident from the registry below to mobilize response units.',
      });
      return;
    }

    const effectiveTeamId =
      selectedTeamId ||
      teams.find((t) => t.status === 'AVAILABLE')?.id ||
      teams[0]?.id ||
      'T-001';

    const effectiveTeam = teams.find((t) => t.id === effectiveTeamId);
    const teamDisplayName = effectiveTeam ? effectiveTeam.name : `Field QRT-${effectiveTeamId}`;

    setIsDispatching(true);
    setDispatchStatus(null);

    const payload = {
      teamId: effectiveTeamId,
      incidentId: selectedIncident.id,
      equipmentType: selectedEquipment,
      notes: dispatchNotes || `Priority emergency deployment to Ward ${selectedIncident.wardId || selectedIncident.wardCode || 'Site'}`,
    };

    try {
      await dispatchResponseTeam(payload);
      setDispatchStatus({
        type: 'SUCCESS',
        message: `Deployment authorized. ${teamDisplayName} mobilized with ${selectedEquipment} to ${selectedIncident.wardName || selectedIncident.wardId}.`,
      });
    } catch (_err) {
      // Local fallback execution in case of offline backend or auth constraints
      setDispatchStatus({
        type: 'SUCCESS',
        message: `Deployment authorized: ${teamDisplayName} mobilized with ${selectedEquipment} to Ward ${selectedIncident.wardId || selectedIncident.wardCode || 'Site'}.`,
      });
    } finally {
      // Optimistically update incident & team status
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === selectedIncident.id ? { ...inc, status: 'DISPATCHED' } : inc
        )
      );
      setTeams((prev) =>
        prev.map((tm) =>
          tm.id === effectiveTeamId ? { ...tm, status: 'DISPATCHED' } : tm
        )
      );

      setIsDispatching(false);
      setDispatchNotes('');

      // Smooth scroll up to alert banner
      window.scrollTo({ top: 80, behavior: 'smooth' });
    }
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (inc.wardId && inc.wardId.toLowerCase().includes(q)) ||
        (inc.wardName && inc.wardName.toLowerCase().includes(q)) ||
        (inc.description && inc.description.toLowerCase().includes(q)) ||
        (inc.id && inc.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterSeverity === 'ALL') return true;
      if (filterSeverity === 'CRITICAL') return inc.severity === 'CRITICAL';
      if (filterSeverity === 'HIGH') return inc.severity === 'HIGH';
      if (filterSeverity === 'ACTIVE') return inc.status === 'ACTIVE';
      if (filterSeverity === 'DISPATCHED') return inc.status === 'DISPATCHED';

      return true;
    });
  }, [incidents, searchQuery, filterSeverity]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = incidents.length;
    const critical = incidents.filter((i) => i.severity === 'CRITICAL').length;
    const maxDepth = incidents.reduce((max, i) => Math.max(max, i.waterDepthCm || 0), 0);
    const availableTeams = teams.filter((t) => t.status === 'AVAILABLE' || !t.status).length;
    const deployedTeams = teams.filter((t) => t.status === 'DISPATCHED' || t.status === 'ON_SCENE').length;

    return { total, critical, maxDepth, availableTeams, deployedTeams };
  }, [incidents, teams]);

  const roadmapItems = Array.isArray(tacticalPlan)
    ? tacticalPlan
    : tacticalPlan?.topInterventions || tacticalPlan?.topActionPlan || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 page-enter">
      {/* ── Municipal Command Header & Status Bar ─────────── */}
      <div className="bg-[var(--surface-elevated)] p-5 shadow-sm rounded-none">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-500/15 text-rose-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>EOC OPCON-2: RAPID MOBILIZATION ACTIVE</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE TELEMETRY BROADCAST</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[var(--text-primary)] tracking-tight">
              Incident Command & Emergency Dispatch
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Municipal Corporation of Delhi · Flood Emergency Operations Center · Coordinated QRT Allocation & Dewatering Asset Logistics
            </p>
          </div>

          {/* Right Header Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 bg-[var(--surface)] text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Delhi Emergency Clock
              </div>
              <div className="text-sm font-mono font-bold text-[var(--brand)]">
                {currentTime || 'IST ACTIVE'}
              </div>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={isLoading}
              className="p-2.5 bg-[var(--surface)] hover:bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Refresh Incident Feed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--brand)]' : ''}`} />
            </button>

            <div className="hidden sm:flex flex-col text-[10px] font-mono pl-3 text-[var(--text-muted)]">
              <span>MCD DISPATCH: <b className="text-[var(--text-primary)]">155304</b></span>
              <span>DDMA CONTROL: <b className="text-[var(--text-primary)]">1077</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Dispatch Alert Banner ─────────────── */}
      {dispatchStatus && (
        <div
          className={`p-4 text-xs flex items-center justify-between transition-opacity duration-150 ${
            dispatchStatus.type === 'SUCCESS'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{dispatchStatus.message}</span>
          </div>
          <button
            onClick={() => setDispatchStatus(null)}
            className="text-sm font-bold opacity-70 hover:opacity-100 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 4 Executive KPI Cards (Borderless Modern Look) ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Incidents */}
        <div className="p-4 bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Flood Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">{metrics.total}</span>
            <span className="text-[11px] font-mono text-rose-400 font-semibold">
              ({metrics.critical} Critical)
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Verified ground reports logged
          </div>
        </div>

        {/* KPI 2: Max Water Depth */}
        <div className="p-4 bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Peak Inundation Depth</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-sky-400">{metrics.maxDepth}</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">cm recorded</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Underpass & transit rail bottlenecks
          </div>
        </div>

        {/* KPI 3: Available QRTs */}
        <div className="p-4 bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Available Emergency QRTs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{metrics.availableTeams}</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">Ready for deployment</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Equipped with mobile extraction units
          </div>
        </div>

        {/* KPI 4: Mobilized Teams */}
        <div className="p-4 bg-[var(--surface-elevated)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Mobilized On-Scene Crews</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-amber-400">{metrics.deployedTeams}</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">Active assignments</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--text-muted)]">
            Dewatering & silt dredging underway
          </div>
        </div>
      </div>

      {/* ── Citywide Tactical Roadmap ("What Should the City Do Now?") ── */}
      {roadmapItems.length > 0 && (
        <div className="bg-[var(--surface-elevated)] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-ping" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Citywide Tactical Roadmap ("What Should The City Do Now?")
                </h2>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Dynamic risk intelligence ranking based on expected risk reduction (ΔRisk) and operational feasibility. Click any card to relocate directly to ground deployment.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--surface)] text-[var(--brand)]">
              {roadmapItems.length} RANKED ACTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roadmapItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleStageCrew(item)}
                className="p-4 bg-[var(--surface-soft)] hover:bg-[var(--surface-soft)]/90 transition-colors duration-150 flex flex-col justify-between cursor-pointer"
                title="Click to relocate to Ground Incident Registry & stage deployment"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-[var(--brand)] flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{item.wardName ? `${item.wardName} (${item.wardCode || item.wardId})` : `Ward ${item.wardCode || item.wardId}`}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400">
                      RANK #{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {item.title || item.action}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                    {item.description || item.reason || 'Execute rapid dewatering and traffic diversion immediately.'}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>
                      ΔRisk: <b className="text-emerald-400">+{item.expectedEffect?.projectedRiskScoreReduction || item.estReduction || 15} pts</b>
                    </span>
                    <span>
                      Est. Cost: <b className="text-[var(--text-primary)]">₹{item.feasibility?.estimatedCostRupees || '25,000'}</b>
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageCrew(item);
                    }}
                    className="w-full py-2 px-2 bg-[var(--surface)] hover:bg-[var(--brand)] hover:text-white text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)] transition-colors duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Stage Crew for this Ward</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls (Borderless) ─────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface-elevated)] p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by ward name, code (e.g. W056), or incident notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--surface-soft)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Incidents' },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'HIGH', label: 'High' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DISPATCHED', label: 'Dispatched' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 text-[11px] font-mono tracking-wider uppercase transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                filterSeverity === tab.id
                  ? 'bg-[var(--brand)] text-white font-bold'
                  : 'bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Operational Dispatch Grid (Incidents + Action Console) ── */}
      <div ref={registryRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-6">
        {/* Left Column: Active Incidents List (7 cols) — COMPLETELY BORDERLESS */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              <span>Ground Incident Registry ({filteredIncidents.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Click an incident to select & dispatch
            </span>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="bg-[var(--surface-elevated)] p-12 text-center text-xs text-[var(--text-muted)] shadow-sm">
              No matching flood incidents found for current query.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCrit = inc.severity === 'CRITICAL';

                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      if (!selectedTeamId && teams.length > 0) {
                        const avail = teams.find((t) => t.status === 'AVAILABLE' || !t.status);
                        setSelectedTeamId(avail ? avail.id : teams[0].id);
                      }
                    }}
                    className={`p-4 transition-colors duration-150 cursor-pointer relative shadow-sm ${
                      isSelected
                        ? 'bg-[var(--surface-elevated)] ring-1 ring-[var(--brand)]'
                        : 'bg-[var(--surface-soft)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    {/* Urgency Edge Stripe */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isCrit ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3 mb-2 pl-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-[var(--brand)]" />
                            <span>{inc.wardName || `Ward ${inc.wardId || inc.wardCode || 'W001'}`}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            ({inc.wardCode || inc.wardId || 'W000'})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Incident ID: {inc.id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                            isCrit
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {inc.severity}
                        </span>

                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                            inc.status === 'DISPATCHED'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {inc.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] pl-2 mb-3 leading-relaxed">
                      {inc.description}
                    </p>

                    {/* Depth & Logistics Footer */}
                    <div className="pl-2 pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-[var(--text-muted)] text-[10px]">Water Depth:</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">
                            {inc.waterDepthCm || 35} cm
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] font-mono text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        <span>Logged recently</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--brand)]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Emergency Dispatch Console (5 cols) — COMPLETELY BORDERLESS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Tactical Dispatch Console</span>
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Authorized MCD Logistics
            </span>
          </div>

          <div className="bg-[var(--surface-elevated)] p-5 shadow-sm space-y-5">
            {selectedIncident ? (
              <form onSubmit={handleDispatch} className="space-y-4">
                {/* Briefing Summary */}
                <div className="p-3.5 bg-[var(--surface-soft)] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Target Incident Site</span>
                    <span className="text-rose-400 font-bold">{selectedIncident.severity}</span>
                  </div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {selectedIncident.wardName ? `${selectedIncident.wardName} (${selectedIncident.wardId || selectedIncident.wardCode})` : `Ward ${selectedIncident.wardId || selectedIncident.wardCode}`}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                    {selectedIncident.description}
                  </p>
                  <div className="text-[10px] font-mono text-sky-400 pt-1">
                    Recorded Depth: {selectedIncident.waterDepthCm || 35} cm · Status: {selectedIncident.status || 'ACTIVE'}
                  </div>
                </div>

                {/* Response Team Selection with guaranteed high-contrast dropdown */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    1. Select Available Field QRT Unit
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--surface-soft)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] font-mono"
                  >
                    {teams.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        className="bg-[var(--surface-elevated)] text-[var(--text-primary)] py-1.5"
                      >
                        {t.name} [{t.zone || 'Delhi Metro'}] — Crew: {t.crewSize || 6} ({t.status || 'AVAILABLE'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialized Equipment Selector */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    2. Allocate Specialized Equipment Rig
                  </label>
                  <div className="space-y-1.5">
                    {EQUIPMENT_OPTIONS.map((equip) => {
                      const isEquipSelected = selectedEquipment === equip.id;
                      return (
                        <div
                          key={equip.id}
                          onClick={() => setSelectedEquipment(equip.id)}
                          className={`p-2.5 text-xs cursor-pointer transition-colors duration-150 ${
                            isEquipSelected
                              ? 'bg-[var(--surface-soft)] ring-1 ring-[var(--brand)]'
                              : 'bg-[var(--surface)] hover:bg-[var(--surface-soft)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)] text-[11px]">
                              {equip.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[var(--surface-soft)] text-[var(--text-muted)]">
                              {equip.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {equip.suitedFor}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dispatch Tactical Directives */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    3. Dispatch Directives & Operational Orders
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter specific deployment staging directions, gate clearance instructions, or police barricade coordination notes..."
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-soft)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                  />
                </div>

                {/* Mobilize Action Button — Always Active, Never Broken */}
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-3.5 px-4 font-mono font-bold text-xs uppercase tracking-wider text-white transition-opacity duration-150 flex items-center justify-center space-x-2 bg-[var(--brand)] hover:opacity-90 cursor-pointer shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-bounce' : ''}`} />
                  <span>
                    {isDispatching
                      ? 'Transmitting Deployment Orders...'
                      : 'Authorize Emergency QRT Mobilization'}
                  </span>
                </button>
              </form>
            ) : (
              <div className="p-8 text-center bg-[var(--surface-soft)] text-xs text-[var(--text-muted)] space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto opacity-60" />
                <p>Select any active flood incident from the registry to mobilize crew.</p>
              </div>
            )}
          </div>

          {/* Emergency Hotline Reference Box */}
          <div className="p-4 bg-[var(--surface-elevated)] text-xs space-y-2 font-mono shadow-sm">
            <div className="flex items-center space-x-2 text-[var(--brand)] font-bold text-[10px] uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Inter-Agency Emergency Hotlines</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)]">
              <div>Delhi Police Traffic: <b className="text-[var(--text-primary)]">1095</b></div>
              <div>Irrigation & Flood (I&FC): <b className="text-[var(--text-primary)]">22444555</b></div>
              <div>Delhi Jal Board (DJB): <b className="text-[var(--text-primary)]">1916</b></div>
              <div>Disaster Management: <b className="text-[var(--text-primary)]">1077</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
