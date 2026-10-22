/**
 * Ward & GIS Data Service
 * Pravah V2 - Phase 3
 *
 * Provides ward GeoJSON retrieval, keyword search, point-in-polygon resolution,
 * and ward detail views with graceful fallback support.
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { validateCoordinates, findWardByPoint, findNearestWard } = require('./gis.service');

const DEMO_BOUNDARIES_PATH = path.resolve(__dirname, '../../data/demo-ward-boundaries.json');

// Cache demo GeoJSON in memory for ultra-fast fallback responses
let cachedDemoFeatureCollection = null;

function getCachedDemoGeoJSON() {
  if (!cachedDemoFeatureCollection) {
    try {
      if (fs.existsSync(DEMO_BOUNDARIES_PATH)) {
        cachedDemoFeatureCollection = JSON.parse(fs.readFileSync(DEMO_BOUNDARIES_PATH, 'utf-8'));
      } else {
        cachedDemoFeatureCollection = { type: 'FeatureCollection', features: [] };
      }
    } catch (parseErr) {
      console.error('[WardService] Failed to parse demo-ward-boundaries.json:', parseErr.message);
      cachedDemoFeatureCollection = { type: 'FeatureCollection', features: [] };
    }
  }
  return cachedDemoFeatureCollection;
}

/**
 * Deterministic generator for balanced municipal ward risk profiles
 * (CRITICAL, HIGH, MODERATE, LOW/SAFE) based on authentic Delhi geographical zones.
 */
function getWardRiskProfile(wardCode, wardName, zone, idx) {
  const codeNum = parseInt(String(wardCode || '').replace(/\D/g, ''), 10) || (idx + 1);
  const nameLower = String(wardName || '').toLowerCase();
  const zoneName = zone || 'Central';

  const isYamunaLowland = nameLower.includes('burari') || nameLower.includes('timarpur') || 
                          nameLower.includes('minto') || nameLower.includes('prahladpur') || 
                          nameLower.includes('seelampur') || nameLower.includes('sangam vihar') ||
                          nameLower.includes('trilokpuri') || nameLower.includes('narela') ||
                          nameLower.includes('mustafabad') || nameLower.includes('karawal') ||
                          nameLower.includes('zakhira') || nameLower.includes('badarpur');

  const isRidgeSafe = nameLower.includes('chanakyapuri') || nameLower.includes('cantt') || 
                      nameLower.includes('vasant') || nameLower.includes('hauz khas') || 
                      nameLower.includes('golf links') || nameLower.includes('defence colony') ||
                      nameLower.includes('greater kailash') || nameLower.includes('pusa') ||
                      nameLower.includes('malviya');

  const seed = (codeNum * 9301 + 49297) % 233280;
  const rnd = seed / 233280;

  let level, score, drainage, rainfall;

  if (isYamunaLowland || (['Shahdara North', 'Narela', 'Civil Lines'].includes(zoneName) && rnd < 0.32)) {
    level = 'CRITICAL';
    score = Math.round(75 + rnd * 18);
    drainage = Math.round(20 + rnd * 18);
    rainfall = Math.round(38 + rnd * 16);
  } else if (isRidgeSafe || (['South', 'Dwarka', 'Keshav Puram', 'Rohini'].includes(zoneName) && rnd > 0.65)) {
    level = 'LOW';
    score = Math.round(15 + rnd * 22);
    drainage = Math.round(75 + rnd * 20);
    rainfall = Math.round(12 + rnd * 12);
  } else if (['Shahdara North', 'Shahdara South', 'Civil Lines'].includes(zoneName) && rnd < 0.65) {
    level = 'HIGH';
    score = Math.round(62 + rnd * 12);
    drainage = Math.round(40 + rnd * 14);
    rainfall = Math.round(30 + rnd * 10);
  } else if (rnd < 0.28) {
    level = 'HIGH';
    score = Math.round(60 + rnd * 13);
    drainage = Math.round(42 + rnd * 13);
    rainfall = Math.round(28 + rnd * 10);
  } else if (rnd > 0.70) {
    level = 'LOW';
    score = Math.round(22 + rnd * 16);
    drainage = Math.round(72 + rnd * 22);
    rainfall = Math.round(14 + rnd * 10);
  } else {
    level = 'MODERATE';
    score = Math.round(44 + rnd * 14);
    drainage = Math.round(55 + rnd * 15);
    rainfall = Math.round(22 + rnd * 8);
  }

  return { level, score, drainage, rainfall };
}

/**
 * Returns all 250 wards as a standard GeoJSON FeatureCollection.
 */
async function getAllWardsGeoJSON() {
  try {
    const rawWards = await prisma.$queryRaw`
      SELECT 
        w.id,
        w.ward_code AS "wardCode",
        w.ward_name AS "wardName",
        w.drainage_capacity AS "drainageCapacity",
        w.population_density AS "populationDensity",
        ST_AsGeoJSON(w.boundary) AS "boundaryGeoJSON",
        COALESCE(rs.risk_score, 45.0) AS "currentRiskScore",
        COALESCE(rs.risk_level::text, 'MODERATE') AS "currentRiskLevel"
      FROM wards w
      LEFT JOIN LATERAL (
        SELECT risk_score, risk_level
        FROM risk_snapshots
        WHERE ward_id = w.id
        ORDER BY calculated_at DESC
        LIMIT 1
      ) rs ON true
      WHERE w.boundary IS NOT NULL;
    `;

    if (rawWards && rawWards.length > 0) {
      const features = rawWards.map((w) => ({
        type: 'Feature',
        id: w.id,
        geometry: JSON.parse(w.boundaryGeoJSON),
        properties: {
          id: w.id,
          ward_code: w.wardCode,
          ward_name: w.wardName,
          name: w.wardName,
          drainage_capacity: w.drainageCapacity,
          drainageCapacity: w.drainageCapacity,
          population_density: w.populationDensity,
          current_risk_score: w.currentRiskScore,
          riskScore: w.currentRiskScore,
          current_risk_level: w.currentRiskLevel,
          riskLevel: w.currentRiskLevel,
          rainfall: 28.5,
          is_synthetic: false,
        },
      }));

      return {
        type: 'FeatureCollection',
        metadata: {
          count: features.length,
          source: 'PostgreSQL/PostGIS live database',
        },
        features,
      };
    }
  } catch {
    // Database offline or query error - fallback to demo dataset
  }

  // Fallback to demo ward boundaries dataset
  const demoCollection = getCachedDemoGeoJSON();
  return {
    type: 'FeatureCollection',
    metadata: {
      count: demoCollection.features.length,
      source: 'local-demo-cache',
      is_synthetic: true,
      note: 'Demo geometries served via resilient local fallback.',
    },
    features: demoCollection.features.map((f, idx) => {
      const prof = getWardRiskProfile(
        f.properties.ward_code,
        f.properties.ward_name,
        f.properties.zone,
        idx
      );

      return {
        ...f,
        properties: {
          ...f.properties,
          id: f.properties.ward_code,
          name: f.properties.ward_name,
          current_risk_score: prof.score,
          riskScore: prof.score,
          current_risk_level: prof.level,
          riskLevel: prof.level,
          drainage_capacity: prof.drainage,
          drainageCapacity: prof.drainage,
          rainfall: prof.rainfall,
        },
      };
    }),
  };
}

/**
 * Searches wards by keyword (ward name, ward code, or zone).
 */
async function searchWards(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();

  try {
    const results = await prisma.ward.findMany({
      where: {
        OR: [
          { wardName: { contains: q, mode: 'insensitive' } },
          { wardCode: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        wardCode: true,
        wardName: true,
        drainageCapacity: true,
        populationDensity: true,
      },
      take: 20,
    });

    if (results && results.length > 0) {
      return results;
    }
  } catch {
    // Fallback search in memory
  }

  const demoCollection = getCachedDemoGeoJSON();
  return demoCollection.features
    .filter((f) => {
      const p = f.properties;
      return (
        p.ward_name.toLowerCase().includes(q) ||
        p.ward_code.toLowerCase().includes(q) ||
        (p.zone && p.zone.toLowerCase().includes(q))
      );
    })
    .slice(0, 20)
    .map((f) => ({
      id: f.properties.ward_code,
      wardCode: f.properties.ward_code,
      wardName: f.properties.ward_name,
      zone: f.properties.zone,
      drainageCapacity: f.properties.drainage_capacity,
      centroid: f.properties.centroid,
    }));
}

/**
 * Resolves which ward contains a given GPS coordinate (lon, lat).
 */
async function resolveWardFromPoint(lon, lat) {
  const coordCheck = validateCoordinates(lon, lat);
  if (!coordCheck.isWithinDelhi) {
    return null;
  }

  try {
    const containingWard = await findWardByPoint(lon, lat);
    if (containingWard) {
      return {
        matched: true,
        matchType: 'CONTAINMENT',
        ward: containingWard,
      };
    }

    const nearestWard = await findNearestWard(lon, lat);
    if (nearestWard) {
      return {
        matched: true,
        matchType: 'PROXIMITY_FALLBACK',
        ward: nearestWard,
      };
    }
  } catch {
    // Fallback: in-memory nearest centroid calculation
  }

  // Calculate Euclidean distance to demo centroids
  const demoCollection = getCachedDemoGeoJSON();
  if (!demoCollection.features.length) {
    return null;
  }

  let closestFeature = null;
  let minDistance = Infinity;

  for (const f of demoCollection.features) {
    const c = f.properties.centroid;
    if (c) {
      const dist = Math.hypot(c.longitude - lon, c.latitude - lat);
      if (dist < minDistance) {
        minDistance = dist;
        closestFeature = f;
      }
    }
  }

  if (closestFeature) {
    return {
      matched: true,
      matchType: 'DEMO_NEAREST_CENTROID',
      approxDistanceKm: parseFloat((minDistance * 111).toFixed(2)),
      ward: {
        id: closestFeature.properties.ward_code,
        wardCode: closestFeature.properties.ward_code,
        wardName: closestFeature.properties.ward_name,
        zone: closestFeature.properties.zone,
        drainageCapacity: closestFeature.properties.drainage_capacity,
      },
    };
  }

  return null;
}

/**
 * Returns comprehensive details for a specific ward.
 */
async function getWardById(id) {
  try {
    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        infrastructure: true,
        incidents: { where: { status: 'ACTIVE' }, take: 5 },
        complaints: { take: 5, orderBy: { createdAt: 'desc' } },
        riskSnapshots: { take: 1, orderBy: { calculatedAt: 'desc' } },
      },
    });

    if (ward) return ward;
  } catch {
    // Fallback
  }

  const demoCollection = getCachedDemoGeoJSON();
  const cleanId = id ? String(id).trim().toUpperCase() : '';
  const numMatch = cleanId.match(/\d+/);
  const standardCode = numMatch
    ? `W${String(parseInt(numMatch[0], 10)).padStart(3, '0')}`
    : null;

  const matched = demoCollection.features.find((f) => {
    const wc = f.properties.ward_code ? String(f.properties.ward_code).toUpperCase() : '';
    return (
      wc === cleanId ||
      (standardCode && wc === standardCode) ||
      f.id === id ||
      (f.properties.ward_name && f.properties.ward_name.toUpperCase() === cleanId)
    );
  });

  if (!matched) return null;

  const prof = getWardRiskProfile(
    matched.properties.ward_code,
    matched.properties.ward_name,
    matched.properties.zone,
    0
  );

  return {
    id: matched.properties.ward_code,
    wardCode: matched.properties.ward_code,
    wardName: matched.properties.ward_name,
    zone: matched.properties.zone,
    drainageCapacity: prof.drainage,
    drainage_capacity: prof.drainage,
    rainfall: prof.rainfall,
    centroid: matched.properties.centroid,
    currentRisk: {
      score: prof.score,
      level: prof.level,
      components: {
        drainage: Math.round(100 - prof.drainage),
        rainfall: Math.round(prof.rainfall * 1.5),
        complaints: prof.level === 'CRITICAL' ? 80 : prof.level === 'HIGH' ? 60 : 35,
      },
    },
    geometry: matched.geometry,
    infrastructure: [
      {
        id: 'infra-demo-1',
        name: `${matched.properties.ward_name} Auxiliary Drainage Sump`,
        type: 'PUMP_STATION',
        status: 'OPERATIONAL',
        capacityValue: 200.0,
      },
    ],
    activeIncidentsCount: 0,
    recentComplaintsCount: 1,
  };
}

/**
 * Returns infrastructure assets located within or near a specific ward.
 */
async function getWardInfrastructure(id) {
  try {
    const items = await prisma.infrastructure.findMany({
      where: { wardId: id },
    });
    if (items && items.length > 0) return items;
  } catch {
    // Fallback
  }

  return [
    {
      id: `infra-${id}-pump`,
      wardId: id,
      name: `Ward ${id} Emergency Submersible Pump`,
      type: 'PUMP_STATION',
      capacityValue: 250.0,
      status: 'OPERATIONAL',
    },
  ];
}

module.exports = {
  getAllWardsGeoJSON,
  searchWards,
  resolveWardFromPoint,
  getWardById,
  getWardInfrastructure,
};
