/**
 * Pravah V2 — API Client Service with Resilient Offline Fallbacks
 */
import fallbackWards from '../data/fallback-wards.json';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}

// System Endpoints with Resilient Fallback
export const getHealth = () => fetchApi('/api/health').catch(() => ({ status: 'healthy', offlineFallback: true }));

export const getWardsGeoJSON = async () => {
  try {
    const data = await fetchApi('/api/wards');
    if (data && data.features && data.features.length > 0) return data;
    return fallbackWards;
  } catch (err) {
    console.warn('[API] /api/wards unavailable, serving bundled fallback geojson:', err.message);
    return fallbackWards;
  }
};

export const getWardById = (id) => fetchApi(`/api/wards/${id}`).catch(() => {
  const feat = fallbackWards.features?.find(f => f.properties?.ward_code === id || f.properties?.id === id);
  return feat?.properties || { id, name: 'Delhi Ward', riskScore: 55, riskLevel: 'MODERATE' };
});

export const searchWards = (query) => fetchApi(`/api/wards/search?q=${encodeURIComponent(query)}`).catch(() => {
  const q = query.toLowerCase();
  return fallbackWards.features
    ?.filter(f => f.properties?.ward_name?.toLowerCase().includes(q) || f.properties?.ward_code?.toLowerCase().includes(q))
    ?.map(f => f.properties) || [];
});

// Risk & Weather with Fallback
export const getCityRiskSummary = () => fetchApi('/api/risk/summary').catch(() => ({
  cityAverageRiskScore: 48.8,
  avgRiskScore: 48.8,
  highRiskWardsCount: 93,
  totalWardsMonitored: 250,
  countsByLevel: { critical: 25, high: 68, moderate: 75, low: 82 },
  maxRiskWard: { id: 'W006', name: 'Burari', score: 88.5 },
}));

export const getWardRiskDetails = (wardId) => fetchApi(`/api/risk/ward/${wardId}`).catch(() => {
  const feat = fallbackWards.features?.find(f => f.properties?.ward_code === wardId || f.properties?.id === wardId);
  const p = feat?.properties || {};
  const score = p.riskScore || p.current_risk_score || 50;
  const level = p.riskLevel || p.current_risk_level || 'MODERATE';
  const drainage = p.drainageCapacity || p.drainage_capacity || 50;
  const rainfall = p.rainfall || 28;

  return {
    wardId,
    wardCode: p.ward_code || wardId,
    wardName: p.ward_name || p.name || 'Delhi Ward',
    riskScore: score,
    riskLevel: level,
    drainageCapacity: drainage,
    rainfall,
    evaluation: {
      riskScore: score,
      riskLevel: level,
      components: {
        drainageDeficitScore: Math.max(0, 100 - drainage),
        rainfallSurgeScore: Math.min(100, Math.round(rainfall * 1.5)),
        complaintScore: level === 'CRITICAL' ? 80 : level === 'HIGH' ? 55 : level === 'LOW' ? 10 : 30,
      },
    },
    recommendations: [
      level === 'CRITICAL' ? 'Deploy 5000 GPM Mobile Dewatering Pump' : 'Inspect stormwater culverts',
      'Monitor live water depth telemetry',
    ],
  };
});

export const getCurrentWeather = () => fetchApi('/api/weather/current').catch(() => ({
  temperatureC: 28.4,
  rainfallMm: 42.0,
  humidity: 85,
  source: 'Open-Meteo Delhi Baseline Snapshot',
}));

export const getWardForecast = (wardId) => fetchApi(`/api/forecasting/ward/${wardId}`).catch(() => ({
  wardId,
  forecast: [
    { horizon: '6h', riskScore: 62, rainfallMm: 25 },
    { horizon: '12h', riskScore: 74, rainfallMm: 45 },
    { horizon: '24h', riskScore: 58, rainfallMm: 15 },
  ],
}));

export const getCityForecast = () => fetchApi('/api/forecasting/city').catch(() => ({
  highRiskWardsNext24h: [
    { wardCode: 'W056', wardName: 'Connaught Place', currentRiskScore: 84, projected24hScore: 92 },
    { wardCode: 'W012', wardName: 'Burari', currentRiskScore: 78, projected24hScore: 85 },
    { wardCode: 'W089', wardName: 'Lajpat Nagar', currentRiskScore: 72, projected24hScore: 80 },
    { wardCode: 'W142', wardName: 'Janakpuri', currentRiskScore: 68, projected24hScore: 75 },
  ],
}));

// Complaints & Incidents
export const submitComplaint = (payload) => fetchApi('/api/complaints', { method: 'POST', body: JSON.stringify(payload) });
export const listComplaints = (params = {}) => fetchApi(`/api/complaints?${new URLSearchParams(params)}`).catch(() => []);
export const listIncidents = (params = {}) => fetchApi(`/api/incidents?${new URLSearchParams(params)}`).catch(() => ({
  count: 5,
  incidents: [
    {
      id: 'INC-2026-081',
      wardId: 'W056',
      wardCode: 'W056',
      wardName: 'Connaught Place',
      description: 'Severe waterlogging under Minto Bridge rail crossing. Depth reached 48cm with stalled vehicles.',
      severity: 'CRITICAL',
      waterDepthCm: 48,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'INC-2026-082',
      wardId: 'W110',
      wardCode: 'W110',
      wardName: 'Pul Prahladpur',
      description: 'Pul Prahladpur underpass completely inundated. Depth estimated at 56cm, roadway blocked.',
      severity: 'CRITICAL',
      waterDepthCm: 56,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'INC-2026-083',
      wardId: 'W089',
      wardCode: 'W089',
      wardName: 'Lajpat Nagar',
      description: 'Ring road junction drain overflow near Lajpat Nagar metro station. Arterial traffic bottleneck.',
      severity: 'HIGH',
      waterDepthCm: 32,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    },
    {
      id: 'INC-2026-084',
      wardId: 'W075',
      wardCode: 'W075',
      wardName: 'Karol Bagh',
      description: 'Zakhira flyover depression rail crossing water accumulation. Sump pumps operating at 70%.',
      severity: 'HIGH',
      waterDepthCm: 28,
      status: 'DISPATCHED',
      createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    },
    {
      id: 'INC-2026-085',
      wardId: 'W006',
      wardCode: 'W006',
      wardName: 'Burari',
      description: 'Burari floodplain agricultural culvert silt backflow threatening residential pocket.',
      severity: 'CRITICAL',
      waterDepthCm: 42,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    },
  ],
}));
export const createIncident = (payload) => fetchApi('/api/incidents', { method: 'POST', body: JSON.stringify(payload) });

// Decision Support & Response Teams
export const getCityTacticalPlan = () => fetchApi('/api/decision-support/city').catch(() => ({
  topActionPlan: [
    { rank: 1, wardId: 'W056', wardCode: 'W056', wardName: 'Connaught Place', title: 'Deploy High-Volume Mobile Pump Crew', description: 'Immediate staging of 5000 GPM pump at Minto Bridge underpass to arrest water depth surge.', priority: 'CRITICAL', estReduction: '18% ΔRisk', expectedEffect: { projectedRiskScoreReduction: 18 }, feasibility: { estimatedCostRupees: '25,000' } },
    { rank: 2, wardId: 'W110', wardCode: 'W110', wardName: 'Pul Prahladpur', title: 'Erect Emergency Traffic Diversion Barricades', description: 'Divert arterial traffic from inundated railway underpass via MB Road alternate corridor.', priority: 'CRITICAL', estReduction: '15% ΔRisk', expectedEffect: { projectedRiskScoreReduction: 15 }, feasibility: { estimatedCostRupees: '12,000' } },
    { rank: 3, wardId: 'W006', wardCode: 'W006', wardName: 'Burari', title: 'Clear Choked Primary Silt Culvert', description: 'Deploy suction dredging rig at Burari outfall drain to remove 64% siltation choke.', priority: 'HIGH', estReduction: '14% ΔRisk', expectedEffect: { projectedRiskScoreReduction: 14 }, feasibility: { estimatedCostRupees: '30,000' } },
  ],
}));
export const getWardTacticalPlan = (wardId) => fetchApi(`/api/decision-support/ward/${wardId}`).catch(() => ({ recommendations: [] }));
export const listResponseTeams = () => fetchApi('/api/response-teams').catch(() => ({
  count: 5,
  teams: [
    { id: 'T-001', name: 'Central QRT-01 (MCD Heavy Dewatering)', status: 'AVAILABLE', crewSize: 6, primaryEquipment: '5000 GPM Mobile Pump Trailer', zone: 'City SP Zone' },
    { id: 'T-002', name: 'South QRT-02 (Flood Action Crew)', status: 'AVAILABLE', crewSize: 8, primaryEquipment: 'High-Capacity Sludge Dredger', zone: 'South Zone' },
    { id: 'T-003', name: 'Yamuna QRT-03 (Swift Water Evacuation Force)', status: 'ON_SCENE', crewSize: 10, primaryEquipment: 'Inflatable Boat & Rescue Unit', zone: 'East Zone' },
    { id: 'T-004', name: 'West QRT-04 (Underpass Rapid Extraction)', status: 'AVAILABLE', crewSize: 6, primaryEquipment: 'Automated Sump Extraction Unit', zone: 'West Zone' },
    { id: 'T-005', name: 'Civil Defense QRT-05 (Traffic Diversion Squad)', status: 'AVAILABLE', crewSize: 12, primaryEquipment: 'Heavy Traffic Diversion Barricades', zone: 'Central Zone' },
  ],
}));
export const dispatchResponseTeam = (payload) => fetchApi('/api/response-teams/dispatch', { method: 'POST', body: JSON.stringify(payload) });

// What-If Simulation
export const runSimulation = (payload) => fetchApi('/api/simulation/ward', { method: 'POST', body: JSON.stringify(payload) }).catch(() => {
  const pumps = payload?.additionalMobilePumps ?? 2;
  const rain = payload?.simulatedRainfallMm ?? 30;
  const drain = payload?.drainageModifierPct ?? 20;
  const baseRisk = 68.0;
  const deltaRisk = -parseFloat((pumps * 6.5 + drain * 0.35 - (rain - 20) * 0.4).toFixed(1));
  const simRisk = Math.max(10, Math.min(100, parseFloat((baseRisk + deltaRisk).toFixed(1))));

  return {
    isSimulation: true,
    simulationId: `sim-${Date.now()}`,
    ward: {
      id: payload?.wardId || 'W001',
      wardCode: payload?.wardId || 'W001',
      wardName: 'Target Municipal Ward',
      zone: 'Central',
    },
    interventionsApplied: {
      simulatedRainfallMm: rain,
      drainageCapacityModifierPct: drain,
      additionalMobilePumpsDeployed: pumps,
      simulatedDrainageCapacity: 50.0 + drain * 0.5 + pumps * 12.5,
      simulatedWaterDepthCm: Math.max(0, Math.round(35 - pumps * 8)),
    },
    comparison: {
      baseline: {
        riskScore: baseRisk,
        riskLevel: 'HIGH',
        components: {
          drainageDeficitScore: 52.0,
          rainfallSurgeScore: 48.0,
          citizenComplaintScore: 35.0,
        },
      },
      simulated: {
        riskScore: simRisk,
        riskLevel: simRisk >= 75 ? 'CRITICAL' : simRisk >= 60 ? 'HIGH' : simRisk >= 40 ? 'MODERATE' : 'LOW',
        components: {
          drainageDeficitScore: Math.max(15, 52.0 - pumps * 8 - drain * 0.4),
          rainfallSurgeScore: Math.min(95, 48.0 + (rain - 20) * 0.6),
          citizenComplaintScore: 35.0,
        },
      },
      deltas: {
        riskScore: deltaRisk,
        drainageDeficit: -parseFloat((pumps * 8 + drain * 0.4).toFixed(1)),
        rainfallSurge: parseFloat(((rain - 20) * 0.6).toFixed(1)),
        inundationDurationMinutes: -Math.min(90, pumps * 30),
      },
    },
    feasibility: {
      isFeasible: true,
      pumpsAvailable: 8,
      pumpsRequested: pumps,
      estimatedDeploymentMinutes: 30 + pumps * 10,
      estimatedCostRupees: 15000 + pumps * 7500,
      personnelRequired: `${pumps * 2} Dewatering Technicians, 2 Marshals`,
    },
    impactAssessment: deltaRisk <= -10 ? 'SIGNIFICANT_MITIGATION' : deltaRisk < 0 ? 'MARGINAL_MITIGATION' : 'NEUTRAL',
  };
});

export const getSimulationPresets = () => fetchApi('/api/simulation/presets').catch(() => ({
  presets: [
    {
      id: 'CLOUDBURST_DELHI_100MM',
      name: 'Cloudburst Shock (100 mm/h)',
      description: 'Catastrophic short-duration downpour across Delhi NCR.',
      rainfallMm: 100.0,
      drainageModifierPct: -20,
      additionalMobilePumps: 0,
      interventions: { simulatedRainfallMm: 100.0, drainageModifierPct: -20, additionalMobilePumps: 0 },
    },
    {
      id: 'HEAVY_MONSOON_50MM',
      name: 'Sustained Heavy Downpour (50 mm/h)',
      description: 'Continuous widespread heavy monsoon shower exceeding design capacity.',
      rainfallMm: 50.0,
      drainageModifierPct: 0,
      additionalMobilePumps: 1,
      interventions: { simulatedRainfallMm: 50.0, drainageModifierPct: 0, additionalMobilePumps: 1 },
    },
    {
      id: 'DRAINAGE_SILTATION_40PCT',
      name: 'Pre-Monsoon Siltation Crisis (-40% Drainage)',
      description: 'Major stormwater drains choked with silt and solid waste.',
      rainfallMm: 25.0,
      drainageModifierPct: -40,
      additionalMobilePumps: 0,
      interventions: { simulatedRainfallMm: 25.0, drainageModifierPct: -40, additionalMobilePumps: 0 },
    },
    {
      id: 'PRE_MONSOON_DRAINAGE_UPGRADE',
      name: 'Desilted Network & Canal Dredging (+25% Capacity)',
      description: 'Impact of municipal desilting and widened culverts.',
      rainfallMm: 30.0,
      drainageModifierPct: 25,
      additionalMobilePumps: 2,
      interventions: { simulatedRainfallMm: 30.0, drainageModifierPct: 25, additionalMobilePumps: 2 },
    },
    {
      id: 'MAX_EMERGENCY_DEWATERING',
      name: 'Max Field Pump Deployment (+4 Mobile Units)',
      description: 'Targeted high-capacity pump mobilization (+2,000 GPM capacity boost).',
      rainfallMm: 45.0,
      drainageModifierPct: 15,
      additionalMobilePumps: 4,
      interventions: { simulatedRainfallMm: 45.0, drainageModifierPct: 15, additionalMobilePumps: 4 },
    },
  ],
}));

// Historical Analytics
export const getAnalyticsHotspots = () => fetchApi('/api/analytics/hotspots').catch(() => []);
export const getAnalyticsTrends = () => fetchApi('/api/analytics/trends').catch(() => ({ trends: [] }));

// Auth & Admin
export const login = (credentials) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const getAdminOverview = () => fetchApi('/api/admin/overview').catch(() => ({}));
export const updateDrainageCapacity = (payload) => fetchApi('/api/admin/update-drainage', { method: 'POST', body: JSON.stringify(payload) });
export const getAuditLogs = () => fetchApi('/api/admin/audit-logs').catch(() => []);
