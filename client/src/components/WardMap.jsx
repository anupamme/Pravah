import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, MapPin, AlertTriangle,
  Waves, Layers
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
 * WardMap — High-Performance Interactive Vector GIS Engine for Delhi Municipal Flood Intelligence.
 *
 * Designed as a 100% keyless, offline-first vector choropleth map.
 * Operates without external tile servers, API keys, or third-party map SDKs.
 */
export default function WardMap({
  wardsData,
  selectedWardId,
  onSelectWard,
  height = '480px',
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredWard, setHoveredWard] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Layer Toggles
  const [showHotspots, setShowHotspots] = useState(true);
  const [showYamunaGauge, setShowYamunaGauge] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);

  // Use provided wardsData or fallback directly
  const data = useMemo(() => {
    if (wardsData && wardsData.features && wardsData.features.length > 0) {
      return wardsData;
    }
    return fallbackWards;
  }, [wardsData]);

  // Delhi coordinate bounds with margin
  const bounds = useMemo(() => {
    return {
      minLng: 76.82,
      maxLng: 77.34,
      minLat: 28.44,
      maxLat: 28.88,
    };
  }, []);

  const svgWidth = 900;
  const svgHeight = 760;

  // Projection: [lng, lat] -> [svgX, svgY]
  const project = useCallback(
    (lng, lat) => {
      const padLng = (bounds.maxLng - bounds.minLng) * 0.035;
      const padLat = (bounds.maxLat - bounds.minLat) * 0.035;
      const minX = bounds.minLng - padLng;
      const maxX = bounds.maxLng + padLng;
      const minY = bounds.minLat - padLat;
      const maxY = bounds.maxLat + padLat;

      const x = ((lng - minX) / (maxX - minX)) * svgWidth;
      const y = ((maxY - lat) / (maxY - minY)) * svgHeight;
      return [x, y];
    },
    [bounds, svgWidth, svgHeight]
  );

  /** Helper to normalize risk levels */
  const normalizeLevel = (level) => String(level || '').toUpperCase().trim();

  const getRiskColors = (level) => {
    switch (normalizeLevel(level)) {
      case 'CRITICAL':
        return { fill: '#ef4444', stroke: '#b91c1c', opacity: 0.65 };
      case 'HIGH':
        return { fill: '#f97316', stroke: '#c2410c', opacity: 0.52 };
      case 'MODERATE':
      case 'MEDIUM':
        return { fill: '#eab308', stroke: '#a16207', opacity: 0.40 };
      case 'LOW':
      default:
        return { fill: '#22c55e', stroke: '#15803d', opacity: 0.28 };
    }
  };

  // Helper to convert ring coordinates into a smooth organic SVG path
  const buildSmoothPath = useCallback((ring) => {
    if (!ring || ring.length < 3) return '';
    const pts = ring.map((pt) => project(pt[0], pt[1]));
    // Remove duplicate trailing point if closed
    if (
      pts.length > 3 &&
      Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.1
    ) {
      pts.pop();
    }
    const n = pts.length;
    if (n < 3) return '';

    // Calculate midpoints between each consecutive vertex
    const midpoints = [];
    for (let i = 0; i < n; i++) {
      const next = pts[(i + 1) % n];
      midpoints.push([(pts[i][0] + next[0]) / 2, (pts[i][1] + next[1]) / 2]);
    }

    // Smooth path using quadratic Bezier curves through midpoints
    let str = `M ${midpoints[0][0].toFixed(1)} ${midpoints[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const ctrl = pts[(i + 1) % n];
      const nextMid = midpoints[(i + 1) % n];
      str += ` Q ${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${nextMid[0].toFixed(1)} ${nextMid[1].toFixed(1)}`;
    }
    return str + ' Z ';
  }, [project]);

  // Convert GeoJSON MultiPolygons into SVG path elements
  const wardPaths = useMemo(() => {
    return (data.features || []).map((feature, idx) => {
      const p = feature.properties || {};
      const code = p.ward_code || p.id || `W${String(idx + 1).padStart(3, '0')}`;
      const name = p.ward_name || p.name || `Ward ${code}`;
      const level = normalizeLevel(p.riskLevel || p.current_risk_level || 'MODERATE');
      const score = p.riskScore ?? p.current_risk_score ?? 50;
      const drainage = p.drainageCapacity ?? p.drainage_capacity ?? 50;
      const rainfall = p.rainfall ?? 28.5;

      let pathStr = '';
      const coords = feature.geometry?.coordinates || [];

      if (feature.geometry?.type === 'Polygon') {
        for (const ring of coords) {
          pathStr += buildSmoothPath(ring);
        }
      } else {
        // MultiPolygon
        for (const polygon of coords) {
          for (const ring of polygon) {
            pathStr += buildSmoothPath(ring);
          }
        }
      }

      // Compute or retrieve centroid
      let centroid = null;
      if (p.centroid && typeof p.centroid.latitude === 'number') {
        const [cx, cy] = project(p.centroid.longitude, p.centroid.latitude);
        centroid = { x: cx, y: cy };
      }

      return {
        code,
        name,
        level,
        score,
        drainage,
        rainfall,
        path: pathStr.trim(),
        centroid,
        rawProperties: p,
      };
    });
  }, [data, project, buildSmoothPath]);

  // Stylized Yamuna River path across Delhi
  const yamunaPath = useMemo(() => {
    const yamunaPoints = [
      [77.20, 28.87],
      [77.22, 28.80],
      [77.23, 28.74],
      [77.24, 28.69],
      [77.25, 28.65],
      [77.27, 28.60],
      [77.29, 28.55],
      [77.31, 28.48],
      [77.32, 28.45],
    ];
    return yamunaPoints
      .map((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      })
      .join(' ');
  }, [project]);

  // Projected coordinates for the 7 Delhi Chronic Flood Hotspots
  const projectedHotspots = useMemo(() => {
    return CHRONIC_HOTSPOTS.map((h) => {
      const [x, y] = project(h.lng, h.lat);
      return { ...h, x, y };
    });
  }, [project]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(Math.max(0.8, prev * zoomFactor), 4.5));
  };

  // Drag to pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Center on selected ward if selected from outside
  useEffect(() => {
    if (!selectedWardId) return;
    const target = wardPaths.find(
      (w) => w.code === selectedWardId || String(w.code) === String(selectedWardId)
    );
    if (target && target.centroid) {
      // Smoothly offset pan toward center
      const centerX = svgWidth / 2;
      const centerY = svgHeight / 2;
      setPan({
        x: (centerX - target.centroid.x) * (zoom * 0.4),
        y: (centerY - target.centroid.y) * (zoom * 0.4),
      });
    }
  }, [selectedWardId, wardPaths, svgWidth, svgHeight, zoom]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredWard(null);
        setHoveredHotspot(null);
      }}
      style={{ height, width: '100%' }}
      className={`relative select-none overflow-hidden rounded-none border border-[var(--border)] bg-[#030712] ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background GIS Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="gis-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gis-grid)" />
      </svg>

      {/* Main Vector Map Layer */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Glowing filter for selected ward */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* River Yamuna Corridor */}
        <g opacity="0.45">
          <path
            d={yamunaPath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={yamunaPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 250 Municipal Ward Polygons */}
        <g>
          {wardPaths.map((ward) => {
            const isSelected =
              ward.code === selectedWardId ||
              String(ward.code) === String(selectedWardId);
            const isHovered = hoveredWard?.code === ward.code;
            const colors = getRiskColors(ward.level);

            return (
              <path
                key={ward.code}
                d={ward.path}
                fill={isSelected ? '#0284c7' : colors.fill}
                fillOpacity={isSelected ? 0.80 : isHovered ? 0.72 : colors.opacity}
                stroke={isSelected ? '#38bdf8' : isHovered ? '#38bdf8' : colors.stroke}
                strokeWidth={isSelected ? 2.8 : isHovered ? 2.0 : 0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={isSelected || isHovered ? 'url(#glow-cyan)' : undefined}
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={() => {
                  setHoveredHotspot(null);
                  setHoveredWard(ward);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredHotspot(null);
                  setHoveredWard(null);
                  if (onSelectWard) onSelectWard(ward.rawProperties);
                }}
              />
            );
          })}
        </g>

        {/* Centroid Pulse Beacons for Critical & High Risk Wards */}
        <g pointerEvents="none">
          {wardPaths
            .filter((w) => (w.level === 'CRITICAL' || w.level === 'HIGH') && w.centroid)
            .map((w) => {
              const isCrit = w.level === 'CRITICAL';
              const color = isCrit ? '#ef4444' : '#f97316';
              return (
                <g key={`pulse-${w.code}`}>
                  {/* Expanding radar ring */}
                  <circle
                    cx={w.centroid.x}
                    cy={w.centroid.y}
                    r={isCrit ? 9 : 7}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values={isCrit ? '4;16;4' : '3;12;3'}
                      dur={isCrit ? '1.8s' : '2.4s'}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.1;0.9"
                      dur={isCrit ? '1.8s' : '2.4s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Core dot */}
                  <circle
                    cx={w.centroid.x}
                    cy={w.centroid.y}
                    r={isCrit ? 3.5 : 2.5}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                </g>
              );
            })}
        </g>

        {/* Chronic Hydrological Flood Hotspots Layer */}
        {showHotspots && (
          <g>
            {projectedHotspots.map((h) => {
              const isCrit = h.severity === 'CRITICAL';
              const col = isCrit ? '#ef4444' : '#f97316';
              return (
                <g
                  key={h.id}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    setHoveredWard(null);
                    setHoveredHotspot(h);
                  }}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredHotspot(null);
                    setHoveredWard(null);
                    const targetWard = wardPaths.find((w) => w.code === h.ward);
                    if (targetWard && onSelectWard) onSelectWard(targetWard.rawProperties);
                  }}
                >
                  {/* Circular Radar Ripple */}
                  <circle cx={h.x} cy={h.y} r="14" fill="none" stroke={col} strokeWidth="1.5" opacity="0.85">
                    <animate attributeName="r" values="6;22;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Simple Circular Beacon Badge */}
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r="8.5"
                    fill="#030712"
                    stroke={col}
                    strokeWidth="2.2"
                  />
                  {/* Inner Warning Core */}
                  <circle cx={h.x} cy={h.y} r="3.5" fill={col} />
                </g>
              );
            })}
          </g>
        )}

        {/* River Label */}
        <text
          x={project(77.27, 28.61)[0] + 12}
          y={project(77.27, 28.61)[1]}
          fill="#38bdf8"
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.1em"
          opacity="0.75"
          className="font-mono uppercase pointer-events-none"
        >
          River Yamuna
        </text>
      </svg>

      {/* ── Top Command Bar (Non-Colliding Unified Layout) ─────── */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Vector Badge & Hydrological Gauge */}
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          <div className="px-2 py-1 bg-[#091220]/90 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse" />
            <span className="hidden sm:inline">Vector GIS · Keyless</span>
            <span className="sm:hidden">GIS</span>
          </div>

          {showYamunaGauge && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#091220]/95 backdrop-blur-md border border-rose-500/40 text-[10px] font-mono shadow-sm">
              <Waves className="w-3 h-3 text-sky-400 flex-shrink-0 animate-pulse" />
              <span className="text-slate-300 hidden md:inline">Yamuna Gauge:</span>
              <span className="font-bold text-rose-400">205.38m</span>
              <span className="text-rose-400 font-bold uppercase text-[9px] px-1 bg-rose-500/15 border border-rose-500/30 hidden sm:inline">
                DANGER +5cm
              </span>
            </div>
          )}
        </div>

        {/* Right: Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto ml-auto">
          {/* Layer Toggles */}
          <div className="flex items-center space-x-1 bg-[#091220]/90 backdrop-blur-md p-0.5 border border-slate-800 text-[10px] font-mono shadow-sm">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-2 py-0.5 rounded-none flex items-center space-x-1 transition-colors cursor-pointer ${
                showHotspots
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Chronic Flood Hotspots"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Hotspots</span>
              <span>({CHRONIC_HOTSPOTS.length})</span>
            </button>
            <button
              onClick={() => setShowYamunaGauge(!showYamunaGauge)}
              className={`px-2 py-0.5 rounded-none flex items-center space-x-1 transition-colors cursor-pointer ${
                showYamunaGauge
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle River Yamuna Water Level Gauge"
            >
              <Waves className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Yamuna</span>
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-0.5 bg-[#091220]/90 backdrop-blur-md p-0.5 border border-slate-800 shadow-sm">
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.25, 4.5))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.8, 0.8))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Reset Overview"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mutually Exclusive Tooltips (Sleek Dark Aerospace Glass) ── */}
      {hoveredHotspot ? (
        <div
          className="absolute z-50 pointer-events-none p-3.5 rounded-none bg-[#0a1222]/95 backdrop-blur-md border border-rose-500/50 text-xs shadow-2xl transition-opacity duration-75 max-w-[240px]"
          style={{
            left: `${Math.max(10, Math.min(tooltipPos.x + 14, (containerRef.current?.clientWidth || 800) - 250))}px`,
            top: `${Math.max(10, Math.min(tooltipPos.y + 14, (containerRef.current?.clientHeight || 480) - 160))}px`,
          }}
        >
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[10px] uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chronic Vulnerability Choke</span>
          </div>
          <div className="font-bold text-white text-[13px] mb-0.5">
            {hoveredHotspot.name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mb-2">
            Classification: {hoveredHotspot.type} · Ward {hoveredHotspot.ward}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800 pt-2 mb-2">
            <div>
              Water Depth: <b className="text-rose-400">{hoveredHotspot.depth}</b>
            </div>
            <div>
              Severity: <b className="text-rose-400">{hoveredHotspot.severity}</b>
            </div>
          </div>
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 font-mono">
            STATUS: {hoveredHotspot.status}
          </div>
        </div>
      ) : hoveredWard ? (
        <div
          className="absolute z-50 pointer-events-none p-3 rounded-none bg-[#0a1222]/95 backdrop-blur-md border border-cyan-500/40 text-xs shadow-2xl transition-opacity duration-75 max-w-[220px]"
          style={{
            left: `${Math.max(10, Math.min(tooltipPos.x + 14, (containerRef.current?.clientWidth || 800) - 230))}px`,
            top: `${Math.max(10, Math.min(tooltipPos.y + 14, (containerRef.current?.clientHeight || 480) - 130))}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-white text-[12px] truncate">
              {hoveredWard.name}
            </span>
            <span className="font-mono text-[10px] text-sky-400 font-bold">
              {hoveredWard.code}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Composite Risk
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-none ${
                hoveredWard.level === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : hoveredWard.level === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : hoveredWard.level === 'MODERATE'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {hoveredWard.level} ({hoveredWard.score})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 border-t border-slate-800 pt-1.5">
            <div>
              Drainage: <b className="text-white">{hoveredWard.drainage}%</b>
            </div>
            <div>
              Rainfall: <b className="text-white">{hoveredWard.rainfall} mm</b>
            </div>
          </div>
          <div className="text-[9px] text-sky-400 mt-1.5 font-medium">
            Click polygon to view live telemetry →
          </div>
        </div>
      ) : null}

      {/* Theme-Adaptive Risk Legend (Bottom Left - Dark Telemetry Panel) */}
      <div className="absolute bottom-3 left-3 z-20 bg-[#091220]/95 backdrop-blur-md p-3 rounded-none border border-slate-800 text-xs shadow-md">
        <div className="font-bold text-white mb-2 text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Delhi Ward Risk Index</span>
        </div>
        <div className="space-y-1 text-[11px] font-medium">
          {[
            { color: 'bg-red-500', label: 'Critical', range: '75 – 100', pulse: true },
            { color: 'bg-orange-500', label: 'High', range: '60 – 74', pulse: true },
            { color: 'bg-yellow-500', label: 'Moderate', range: '40 – 59', pulse: false },
            { color: 'bg-emerald-500', label: 'Low', range: '< 40', pulse: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
              <span className="text-slate-300">{item.label}</span>
              <span className="text-slate-500 text-[9px] font-mono">({item.range})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Zoom Instruction Badge (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-20 hidden sm:flex items-center space-x-1.5 px-2 py-1 bg-[#091220]/80 backdrop-blur-sm border border-slate-800 text-[9px] font-mono text-slate-400">
        <MapPin className="w-2.5 h-2.5 text-sky-400" />
        <span>Drag to pan · Scroll to zoom · Click to select</span>
      </div>
    </div>
  );
}
