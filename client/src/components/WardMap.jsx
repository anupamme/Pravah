import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, AlertTriangle, Layers, Droplets, ZoomIn, ZoomOut, RotateCcw,
  Eye, EyeOff, ShieldAlert, Waves
} from 'lucide-react';
import fallbackWards from '../data/fallback-wards.json';

/** Delhi Chronic Hydrological Hotspots officially monitored by MCD & Delhi Police */
const CHRONIC_HOTSPOTS = [
  { id: 'h1', name: 'Minto Bridge Underpass', lng: 77.225, lat: 28.636, type: 'RAIL UNDERPASS', depth: '48 cm', status: '5000 GPM PUMP ACTIVE', severity: 'CRITICAL', ward: 'W056' },
  { id: 'h2', name: 'ITO Ring Road Junction', lng: 77.245, lat: 28.628, type: 'TRANSIT ARTERIAL', depth: '32 cm', status: 'DIVERSION VIA DDU MARG', severity: 'HIGH', ward: 'W089' },
  { id: 'h3', name: 'Pul Prahladpur Underpass', lng: 77.293, lat: 28.511, type: 'ROAD UNDERPASS', depth: '56 cm', status: 'ROADWAY BARRICADED', severity: 'CRITICAL', ward: 'W110' },
  { id: 'h4', name: 'Zakhira Flyover Depression', lng: 77.156, lat: 28.665, type: 'RAIL DEPRESSION', depth: '28 cm', status: 'AUTOMATIC SUMP ONLINE', severity: 'HIGH', ward: 'W075' },
  { id: 'h5', name: 'Kashmere Gate ISBT Drain', lng: 77.228, lat: 28.668, type: 'YAMUNA OUTFALL', depth: '36 cm', status: 'SUCTION DREDGING ACTIVE', severity: 'HIGH', ward: 'W013' },
  { id: 'h6', name: 'Burari Floodplain Culvert', lng: 77.195, lat: 28.762, type: 'AGRICULTURAL BASIN', depth: '42 cm', status: 'MOBILE CREW DISPATCHED', severity: 'CRITICAL', ward: 'W006' },
  { id: 'h7', name: 'AIIMS Ring Road Underpass', lng: 77.210, lat: 28.568, type: 'TRANSIT ARTERIAL', depth: '22 cm', status: 'STANDARD MONITORING', severity: 'MODERATE', ward: 'W142' },
];

/**
 * WardMap — High-Performance Leaflet GIS Engine for Delhi Municipal Flood Intelligence.
 * 100% Free & Keyless OpenStreetMap Base Tiles (NO API Keys Required).
 * Renders interactive circular flood zones that scale, zoom, and separate naturally across Delhi.
 */
export default function WardMap({
  wardsData,
  selectedWardId,
  onSelectWard,
  height = '500px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const wardCirclesGroupRef = useRef(null);
  const hotspotsGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Map Controls State
  const [mapTheme, setMapTheme] = useState('street'); // 'street' | 'dark'
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCircles, setShowCircles] = useState(true);
  const [hoveredWard, setHoveredWard] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  // Wards GeoJSON Features with resilient fallback
  const data = useMemo(() => {
    if (wardsData && wardsData.features && wardsData.features.length > 0) {
      return wardsData;
    }
    return fallbackWards;
  }, [wardsData]);

  const normalizeLevel = (level) => String(level || '').toUpperCase().trim();

  const getRiskColor = (level) => {
    switch (normalizeLevel(level)) {
      case 'CRITICAL':
        return { fill: '#ef4444', stroke: '#b91c1c', opacity: 0.55 };
      case 'HIGH':
        return { fill: '#f97316', stroke: '#c2410c', opacity: 0.45 };
      case 'MODERATE':
      case 'MEDIUM':
        return { fill: '#eab308', stroke: '#a16207', opacity: 0.35 };
      case 'LOW':
      default:
        return { fill: '#22c55e', stroke: '#15803d', opacity: 0.28 };
    }
  };

  // Compute Lat/Lng centroid for all 250 wards
  const wardCentroids = useMemo(() => {
    return (data.features || []).map((feature, idx) => {
      const p = feature.properties || {};
      const code = p.ward_code || p.id || `W${String(idx + 1).padStart(3, '0')}`;
      const name = p.ward_name || p.name || `Ward ${code}`;
      const level = normalizeLevel(p.riskLevel || p.current_risk_level || 'MODERATE');
      const score = p.riskScore ?? p.current_risk_score ?? 50;
      const drainage = p.drainageCapacity ?? p.drainage_capacity ?? 50;
      const rainfall = p.rainfall ?? 28.5;
      const zone = p.zone || 'Central Delhi';

      let lat = 28.6139;
      let lng = 77.2090;
      const coords = feature.geometry?.coordinates || [];

      try {
        const ring = feature.geometry?.type === 'Polygon' ? coords[0] : coords[0]?.[0];
        if (ring && ring.length > 0) {
          const sum = ring.reduce((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0, 0]);
          lng = sum[0] / ring.length;
          lat = sum[1] / ring.length;
        }
      } catch {
        // use fallback center
      }

      return {
        code,
        name,
        level,
        score,
        drainage,
        rainfall,
        zone,
        lat,
        lng,
        rawProperties: p,
      };
    });
  }, [data]);

  // ── 1. Initialize Leaflet Map Instance ────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet Map centered on Delhi
      const map = L.map(mapContainerRef.current, {
        center: [28.625, 77.200],
        zoom: 11,
        minZoom: 10,
        maxZoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Strict Delhi Municipal Boundary Constraints
      const delhiBounds = L.latLngBounds([28.38, 76.80], [28.92, 77.40]);
      map.setMaxBounds(delhiBounds);

      // Official Keyless OpenStreetMap Tiles (100% Free & No API Key Needed)
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      wardCirclesGroupRef.current = L.layerGroup().addTo(map);
      hotspotsGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Ensure tiles render immediately without gray blank areas
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── 2. Render Interactive Circles for Zones (Zoom & Separate) ─
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = wardCirclesGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (!showCircles) return;

    wardCentroids.forEach((ward) => {
      const isSelected = selectedWardId && String(ward.code) === String(selectedWardId);
      const colors = getRiskColor(ward.level);

      // In Leaflet, L.circle radius is defined in METERS on the real earth!
      // This means as the user zooms in, the circles zoom and SEPARATE across the street grid!
      const circle = L.circle([ward.lat, ward.lng], {
        radius: isSelected ? 850 : 650, // 650 meters radius
        color: isSelected ? '#38bdf8' : colors.stroke,
        weight: isSelected ? 3.5 : 1.5,
        fillColor: isSelected ? '#0284c7' : colors.fill,
        fillOpacity: isSelected ? 0.80 : colors.opacity,
        className: 'interactive-ward-circle',
      });

      // Interactive Events
      circle.on({
        mouseover: (e) => {
          const target = e.target;
          target.setStyle({
            weight: 3.0,
            color: '#38bdf8',
            fillOpacity: 0.75,
          });
          target.bringToFront();
          setHoveredWard(ward);
        },
        mouseout: (e) => {
          const target = e.target;
          if (!isSelected) {
            target.setStyle({
              weight: 1.5,
              color: colors.stroke,
              fillOpacity: colors.opacity,
            });
          }
          setHoveredWard(null);
        },
        click: () => {
          if (onSelectWard) {
            onSelectWard(ward.rawProperties);
          }
          map.flyTo([ward.lat, ward.lng], Math.max(map.getZoom(), 13), {
            duration: 0.8,
          });
        },
      });

      // Bind clean tooltip popup
      circle.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 2px;">
          <b>${ward.name}</b> (${ward.code})<br/>
          Risk Score: <b>${ward.score}/100</b> · ${ward.level}
        </div>`,
        { sticky: true, className: 'ward-circle-tooltip' }
      );

      group.addLayer(circle);
    });
  }, [wardCentroids, selectedWardId, showCircles, onSelectWard]);

  // ── 3. Render Circular Chronic Flood Hotspots (Beacons) ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = hotspotsGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (!showHotspots) return;

    CHRONIC_HOTSPOTS.forEach((spot) => {
      const isCrit = spot.severity === 'CRITICAL';
      const color = isCrit ? '#ef4444' : '#f97316';

      // Outer Radar Ripple Circle (400 meters radius)
      const rippleCircle = L.circle([spot.lat, spot.lng], {
        radius: 400,
        color: color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.20,
        dashArray: '4 4',
      });

      // Center Core CircleMarker (Fixed pixel circle beacon)
      const coreMarker = L.circleMarker([spot.lat, spot.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      });

      coreMarker.on({
        mouseover: () => setHoveredHotspot(spot),
        mouseout: () => setHoveredHotspot(null),
        click: () => {
          const matchedWard = wardCentroids.find((w) => w.code === spot.ward);
          if (matchedWard && onSelectWard) {
            onSelectWard(matchedWard.rawProperties);
          }
          map.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
        },
      });

      // Popup with emergency depth telemetry
      coreMarker.bindPopup(
        `<div style="font-family: monospace; font-size: 11px; min-width: 170px; padding: 4px; color: #0f172a;">
          <div style="font-weight: bold; color: ${color}; font-size: 12px; margin-bottom: 2px;">${spot.name}</div>
          <div style="color: #64748b; font-size: 10px;">${spot.type} · ${spot.ward}</div>
          <div style="margin-top: 5px; font-size: 11px;">Waterlogging Depth: <b style="color: #dc2626;">${spot.depth}</b></div>
          <div style="color: #0284c7; font-size: 10px; margin-top: 2px; font-weight: bold;">${spot.status}</div>
        </div>`
      );

      group.addLayer(rippleCircle);
      group.addLayer(coreMarker);
    });
  }, [showHotspots, wardCentroids, onSelectWard]);

  // ── 4. Center on Selected Ward ────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedWardId) return;

    const target = wardCentroids.find(
      (w) => String(w.code) === String(selectedWardId)
    );

    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 12), {
        duration: 0.8,
      });
    }
  }, [selectedWardId, wardCentroids]);

  // Map Navigation Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    mapInstanceRef.current?.setView([28.625, 77.200], 11, { animate: true });
  };

  return (
    <div
      style={{ height, width: '100%' }}
      className={`relative select-none overflow-hidden rounded-none border border-[var(--border)] shadow-sm font-mono text-xs ${
        mapTheme === 'dark' ? 'leaflet-dark-mode' : ''
      }`}
    >
      {/* ── Leaflet Map Container ─────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ── Top-Left: Map Controls & Telemetry Header (Strict Rectangles) ── */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 pointer-events-auto">
        {/* Real Map Indicator */}
        <div className="px-2.5 py-1 bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--border)] text-[10px] font-mono text-[var(--text-primary)] flex items-center space-x-1.5 shadow-md rounded-none">
          <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
          <span className="font-bold">OpenStreetMap Live GIS</span>
        </div>

        {/* Theme Switcher (Street View vs Dark Tactical) */}
        <div className="flex items-center space-x-1 bg-[var(--surface-elevated)]/95 backdrop-blur-md p-0.5 border border-[var(--border)] rounded-none shadow-md">
          <button
            type="button"
            onClick={() => setMapTheme('street')}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer ${
              mapTheme === 'street'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            Street Map
          </button>
          <button
            type="button"
            onClick={() => setMapTheme('dark')}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer ${
              mapTheme === 'dark'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            Dark Tactical
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center space-x-1 bg-[var(--surface-elevated)]/95 backdrop-blur-md p-0.5 border border-[var(--border)] rounded-none shadow-md">
          <button
            type="button"
            onClick={() => setShowCircles(!showCircles)}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer flex items-center space-x-1 ${
              showCircles
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Zone Circles ({wardCentroids.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer flex items-center space-x-1 ${
              showHotspots
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Hotspots ({CHRONIC_HOTSPOTS.length})</span>
          </button>
        </div>
      </div>

      {/* ── Top-Right: Zoom & Reset Navigation (Strict Rectangles) ── */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col space-y-1 bg-[var(--surface-elevated)]/95 backdrop-blur-md p-1 border border-[var(--border)] rounded-none shadow-md pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In (Circles will separate)"
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] rounded-none cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] rounded-none cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Delhi Overview"
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] rounded-none cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bottom-Left: Real-Time Ward Telemetry HUD (Strict Rectangle) ── */}
      {hoveredWard && (
        <div className="absolute bottom-3 left-3 z-[400] max-w-sm bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--brand)] p-3 rounded-none shadow-xl space-y-1.5 animate-in fade-in pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-1">
            <span className="font-bold text-[var(--text-primary)] text-xs flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>{hoveredWard.name}</span>
            </span>
            <span className="px-1.5 py-0.2 bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] text-[9px] uppercase">
              {hoveredWard.code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>Risk Score: <b className="text-[var(--brand)]">{hoveredWard.score}/100</b></div>
            <div>Severity: <b className={
              hoveredWard.level === 'CRITICAL' ? 'text-rose-400 font-bold' :
              hoveredWard.level === 'HIGH' ? 'text-orange-400 font-bold' :
              hoveredWard.level === 'MODERATE' ? 'text-yellow-400 font-bold' : 'text-emerald-400 font-bold'
            }>{hoveredWard.level}</b></div>
            <div>Drainage: <b className="text-[var(--text-primary)]">{hoveredWard.drainage}%</b></div>
            <div>Rainfall: <b className="text-sky-400">{hoveredWard.rainfall} mm</b></div>
          </div>
          <div className="text-[9px] text-[var(--brand)] pt-0.5 border-t border-[var(--border)] font-medium">
            Click circle to lock ward telemetry & zoom in →
          </div>
        </div>
      )}

      {/* ── Bottom-Right: Color Risk Choropleth Legend (Strict Rectangle) ── */}
      <div className="absolute bottom-3 right-3 z-[400] bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--border)] p-2.5 rounded-none shadow-md space-y-1 text-[10px] pointer-events-auto">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
          Flood Risk Zone Legend
        </div>
        <div className="flex items-center space-x-3 font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-none bg-rose-500 inline-block animate-pulse" />
            <span className="text-rose-400 font-bold">Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-none bg-orange-500 inline-block" />
            <span className="text-orange-400 font-bold">High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-none bg-yellow-500 inline-block" />
            <span className="text-yellow-400 font-bold">Mod</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 inline-block" />
            <span className="text-emerald-400 font-bold">Low</span>
          </span>
        </div>
      </div>
    </div>
  );
}
