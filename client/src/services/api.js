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
export const listIncidents = (params = {}) => fetchApi(`/api/incidents?${new URLSearchParams(params)}`).catch(() => []);
export const createIncident = (payload) => fetchApi('/api/incidents', { method: 'POST', body: JSON.stringify(payload) });

// Decision Support & Response Teams
export const getCityTacticalPlan = () => fetchApi('/api/decision-support/city').catch(() => ({
  topActionPlan: [
    { rank: 1, wardId: 'W056', wardName: 'Connaught Place', action: 'Deploy High-Volume Pump Crew', priority: 'CRITICAL', estReduction: '18% ΔRisk' },
    { rank: 2, wardId: 'W012', wardName: 'Burari', action: 'Clear Choked Primary Silt Culvert', priority: 'HIGH', estReduction: '14% ΔRisk' },
    { rank: 3, wardId: 'W089', wardName: 'Lajpat Nagar', action: 'Divert Traffic from Ring Road Underpass', priority: 'HIGH', estReduction: '10% ΔRisk' },
  ],
}));
export const getWardTacticalPlan = (wardId) => fetchApi(`/api/decision-support/ward/${wardId}`).catch(() => ({ recommendations: [] }));
export const listResponseTeams = () => fetchApi('/api/response-teams').catch(() => []);
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
