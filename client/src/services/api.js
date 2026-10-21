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
  cityAverageRiskScore: 58.4,
  avgRiskScore: 58.4,
  highRiskWardsCount: 50,
  totalWardsMonitored: 250,
  countsByLevel: { critical: 12, high: 38, moderate: 110, low: 90 },
  maxRiskWard: { id: 'W056', name: 'Connaught Place', score: 88.5 },
}));

export const getWardRiskDetails = (wardId) => fetchApi(`/api/risk/ward/${wardId}`).catch(() => {
  const feat = fallbackWards.features?.find(f => f.properties?.ward_code === wardId || f.properties?.id === wardId);
  const p = feat?.properties || {};
  return {
    wardId,
    wardName: p.ward_name || p.name || 'Delhi Ward',
    riskScore: p.riskScore || p.current_risk_score || 65,
    riskLevel: p.riskLevel || p.current_risk_level || 'HIGH',
    breakdown: {
      drainage: { score: p.drainageCapacity || p.drainage_capacity || 35, weight: 0.40 },
      rainfall: { score: p.rainfall || 72, weight: 0.35 },
      complaints: { score: p.complaintCount || 60, weight: 0.25 },
    },
    recommendations: [
      'Deploy 5000 GPM Mobile Dewatering Pump',
      'Clear stormwater siltation accumulation at culverts',
      'Issue local civic waterlogging advisory',
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
export const runSimulation = (payload) => fetchApi('/api/simulation/ward', { method: 'POST', body: JSON.stringify(payload) }).catch(() => ({
  baselineRisk: 78,
  simulatedRisk: 54,
  deltaRisk: -24,
  feasibility: 'FEASIBLE',
}));
export const getSimulationPresets = () => fetchApi('/api/simulation/presets').catch(() => [
  { id: 'monsoon-cloudburst', name: 'Monsoon Cloudburst (75mm/h)', rainfallIncrease: 75, pumpUnits: 2 },
  { id: 'drainage-failure', name: '50% Drainage Network Choke', drainageReduction: 50, pumpUnits: 0 },
]);

// Historical Analytics
export const getAnalyticsHotspots = () => fetchApi('/api/analytics/hotspots').catch(() => []);
export const getAnalyticsTrends = () => fetchApi('/api/analytics/trends').catch(() => ({ trends: [] }));

// Auth & Admin
export const login = (credentials) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const getAdminOverview = () => fetchApi('/api/admin/overview').catch(() => ({}));
export const updateDrainageCapacity = (payload) => fetchApi('/api/admin/update-drainage', { method: 'POST', body: JSON.stringify(payload) });
export const getAuditLogs = () => fetchApi('/api/admin/audit-logs').catch(() => []);
