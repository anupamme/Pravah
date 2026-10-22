import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, AlertTriangle, Layers, Droplets, RefreshCw, ZoomIn, ZoomOut, Maximize2
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

/** Base Tile Providers for Real Geographic Backgrounds */
const BASEMAP_TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    name: 'Dark GIS',
    subdomains: 'abcd',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    name: 'Street View',
    subdomains: 'abc',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    name: 'Satellite',
    subdomains: '',
  },
};

/**
 * WardMap — High-Performance Real Leaflet GIS Engine with Delhi Municipal Wards,
 * Real Background Street/Satellite Maps, and Chronic Flood Hotspot Telemetry.
 */
export default function WardMap({
  wardsData,
  selectedWardId,
  onSelectWard,
  height = '480px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const hotspotsLayerRef = useRef(null);

  // Basemap & Layer Controls
  const [activeBasemap, setActiveBasemap] = useState('dark');
  const [showHotspots, setShowHotspots] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredWard, setHoveredWard] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Wards data with resilient fallback
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
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MODERATE':
      case 'MEDIUM':
        return '#eab308';
      case 'LOW':
      default:
        return '#22c55e';
    }
  };

  // ── Initialize Leaflet Map ────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against multiple initializations
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.625, 77.195],
        zoom: 11,
        minZoom: 10,
        maxZoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Delhi Bounds constraint
      const delhiBounds = L.latLngBounds([28.38, 76.80], [28.92, 77.40]);
      map.setMaxBounds(delhiBounds);

      // Base Tile Layer (Real map)
      const base = BASEMAP_TILES[activeBasemap] || BASEMAP_TILES.dark;
      const tileLayer = L.tileLayer(base.url, {
        attribution: base.attribution,
        subdomains: base.subdomains,
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Invalidate size once rendered
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Switch Basemap Tiles (Dark / Streets / Satellite) ─────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const base = BASEMAP_TILES[activeBasemap] || BASEMAP_TILES.dark;
    const tileLayer = L.tileLayer(base.url, {
      attribution: base.attribution,
      subdomains: base.subdomains,
      maxZoom: 19,
      opacity: activeBasemap === 'satellite' ? 0.95 : 0.88,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [activeBasemap]);

  // ── Render Municipal Ward Polygons on Top of Real Map ────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !data || !data.features) return;

    // Remove old layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(data, {
      style: (feature) => {
        const p = feature.properties || {};
        const code = p.ward_code || p.id;
        const isSelected = selectedWardId && String(code) === String(selectedWardId);
        const color = getRiskColor(p.riskLevel || p.current_risk_level || 'MODERATE');

        return {
          fillColor: isSelected ? '#0284c7' : color,
          fillOpacity: isSelected ? 0.65 : 0.30,
          color: isSelected ? '#38bdf8' : color,
          weight: isSelected ? 2.8 : 1.2,
          opacity: isSelected ? 1 : 0.75,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const code = p.ward_code || p.id;
        const name = p.ward_name || p.name || `Ward ${code}`;

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#38bdf8',
              fillOpacity: 0.60,
            });
            target.bringToFront();
            setHoveredWard({
              name,
              code,
              riskScore: p.riskScore ?? p.current_risk_score ?? 50,
              level: normalizeLevel(p.riskLevel || p.current_risk_level || 'MODERATE'),
              drainageCapacity: p.drainageCapacity ?? 50,
              rainfallMm: p.rainfall ?? 28.5,
              zone: p.zone || 'Central Delhi',
            });
          },
          mouseout: (e) => {
            geoLayer.resetStyle(e.target);
            setHoveredWard(null);
          },
          click: () => {
            if (onSelectWard) {
              onSelectWard(p);
            }
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoLayer;
  }, [data, selectedWardId, onSelectWard]);

  // ── Render Chronic Flood Hotspots ─────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hotspotsLayerRef.current) {
      map.removeLayer(hotspotsLayerRef.current);
    }

    if (!showHotspots) return;

    const layerGroup = L.layerGroup();

    CHRONIC_HOTSPOTS.forEach((spot) => {
      const isCrit = spot.severity === 'CRITICAL';
      const pulseColor = isCrit ? '#ef4444' : '#f59e0b';

      const customIcon = L.divIcon({
        className: 'flood-hotspot-pin',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 20px; height: 20px; background: ${pulseColor}; opacity: 0.3; border-radius: 0px; transform: scale(1.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 14px; height: 14px; background: ${pulseColor}; border: 1.5px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 8px; font-weight: bold; color: #ffffff; font-family: monospace;">!</span>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; padding: 4px; color: #0f172a; min-width: 170px;">
          <div style="font-weight: bold; color: ${pulseColor}; margin-bottom: 2px;">${spot.name}</div>
          <div style="color: #64748b; font-size: 10px;">${spot.type} · ${spot.ward}</div>
          <div style="margin-top: 4px; font-size: 11px;">Water Depth: <b>${spot.depth}</b></div>
          <div style="color: #0284c7; font-size: 10px; margin-top: 2px;">${spot.status}</div>
        </div>
      `, {
        className: 'hotspot-custom-popup',
      });

      layerGroup.addLayer(marker);
    });

    layerGroup.addTo(map);
    hotspotsLayerRef.current = layerGroup;
  }, [showHotspots]);

  // Center on selected ward
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedWardId || !data?.features) return;

    const matched = data.features.find(
      (f) => String(f.properties?.ward_code || f.properties?.id) === String(selectedWardId)
    );

    if (matched && matched.geometry) {
      try {
        const tempLayer = L.geoJSON(matched);
        const bounds = tempLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { maxZoom: 13, duration: 0.8 });
        }
      } catch (err) {
        // ignore bounds calculation error
      }
    }
  }, [selectedWardId, data]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    mapInstanceRef.current?.setView([28.625, 77.195], 11, { animate: true });
  };

  return (
    <div
      style={{ height, width: '100%' }}
      className="relative select-none overflow-hidden rounded-none border border-[var(--border)] bg-[#050B14] shadow-sm font-mono text-xs"
    >
      {/* ── Leaflet Container ─────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ── Top-Left: Basemap Selector & Layers (Strict Rectangles) */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 bg-[var(--surface-elevated)]/90 backdrop-blur-md p-1.5 border border-[var(--border)] rounded-none shadow-md">
        <div className="flex items-center space-x-1 border-r border-[var(--border)] pr-1.5 mr-0.5">
          <Layers className="w-3.5 h-3.5 text-[var(--brand)]" />
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] hidden sm:inline">Map View</span>
        </div>

        {Object.entries(BASEMAP_TILES).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveBasemap(key)}
            className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer ${
              activeBasemap === key
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]'
            }`}
          >
            {config.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowHotspots(!showHotspots)}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-none border transition-colors cursor-pointer flex items-center space-x-1 ${
            showHotspots
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          <span>Hotspots ({CHRONIC_HOTSPOTS.length})</span>
        </button>
      </div>

      {/* ── Top-Right: Zoom & Reset Controls (Strict Rectangles) ── */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col space-y-1 bg-[var(--surface-elevated)]/90 backdrop-blur-md p-1 border border-[var(--border)] rounded-none shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
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
          title="Reset Delhi View"
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] rounded-none cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Hovered Ward Telemetry HUD (Strict Rectangle) ────── */}
      {hoveredWard && (
        <div className="absolute bottom-3 left-3 z-[400] max-w-sm bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--brand)] p-3 rounded-none shadow-xl space-y-1.5 animate-in fade-in">
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
            <div>Risk Score: <b className="text-[var(--brand)]">{hoveredWard.riskScore}/100</b></div>
            <div>Level: <b className={
              hoveredWard.level === 'CRITICAL' ? 'text-rose-400' :
              hoveredWard.level === 'HIGH' ? 'text-amber-400' :
              hoveredWard.level === 'MODERATE' ? 'text-yellow-400' : 'text-emerald-400'
            }>{hoveredWard.level}</b></div>
            <div>Drainage: <b className="text-[var(--text-primary)]">{hoveredWard.drainageCapacity}%</b></div>
            <div>Precipitation: <b className="text-sky-400">{hoveredWard.rainfallMm} mm</b></div>
          </div>
          <div className="text-[9px] text-[var(--text-muted)] pt-0.5 border-t border-[var(--border)]">
            Click polygon to lock ward telemetry
          </div>
        </div>
      )}

      {/* ── Bottom-Right: Color Risk Choropleth Legend (Strict Rectangle) */}
      {showLegend && (
        <div className="absolute bottom-3 right-3 z-[400] bg-[var(--surface-elevated)]/90 backdrop-blur-md border border-[var(--border)] p-2.5 rounded-none shadow-md space-y-1.5 text-[10px]">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Ward Risk Index
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-none bg-rose-500 inline-block" />
              <span className="text-rose-400">Critical</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-none bg-orange-500 inline-block" />
              <span className="text-orange-400">High</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-none bg-yellow-500 inline-block" />
              <span className="text-yellow-400">Mod</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 inline-block" />
              <span className="text-emerald-400">Low</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
