import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Shield, Layers } from 'lucide-react';
import fallbackWards from '../data/fallback-wards.json';

/**
 * WardMap — High-Performance Interactive Vector GIS Engine for Delhi Municipal Flood Intelligence.
 *
 * Designed as a 100% keyless, offline-first vector choropleth map.
 * Operates without external tile servers, API keys, or third-party map SDKs.
 * Features:
 * - Dynamic equirectangular projection of all 250 Delhi municipal ward MultiPolygons
 * - Smooth pan and zoom (drag, mouse wheel, toolbar controls)
 * - Choropleth risk visualization (Critical, High, Moderate, Low)
 * - Pulsing centroid radar beacons on Critical and High vulnerability wards
 * - Stylized River Yamuna hydrological corridor
 * - Hover tooltip with live ward risk metrics
 * - Click-to-inspect synchronization with the Ward Intelligence Panel
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
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
          if (!ring || ring.length === 0) continue;
          for (let i = 0; i < ring.length; i++) {
            const [x, y] = project(ring[i][0], ring[i][1]);
            pathStr += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
          }
          pathStr += 'Z ';
        }
      } else {
        // MultiPolygon
        for (const polygon of coords) {
          for (const ring of polygon) {
            if (!ring || ring.length === 0) continue;
            for (let i = 0; i < ring.length; i++) {
              const [x, y] = project(ring[i][0], ring[i][1]);
              pathStr += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
            }
            pathStr += 'Z ';
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
  }, [data, project]);

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
                fillOpacity={isSelected ? 0.75 : isHovered ? 0.70 : colors.opacity}
                stroke={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : colors.stroke}
                strokeWidth={isSelected ? 2.8 : isHovered ? 2.0 : 0.8}
                filter={isSelected ? 'url(#glow-cyan)' : undefined}
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredWard(ward)}
                onClick={(e) => {
                  e.stopPropagation();
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

      {/* Floating Interactive Tooltip */}
      {hoveredWard && (
        <div
          className="absolute z-50 pointer-events-none p-3 rounded-none bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--border-strong)] text-xs shadow-2xl transition-all duration-75"
          style={{
            left: `${Math.min(tooltipPos.x + 14, (containerRef.current?.clientWidth || 800) - 210)}px`,
            top: `${Math.min(tooltipPos.y + 14, (containerRef.current?.clientHeight || 480) - 130)}px`,
            minWidth: '190px',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-[var(--text-primary)] text-[12px] truncate">
              {hoveredWard.name}
            </span>
            <span className="font-mono text-[10px] text-[var(--brand)] font-bold">
              {hoveredWard.code}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
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

          <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-secondary)] border-t border-[var(--border)] pt-1.5">
            <div>
              Drainage: <b className="text-[var(--text-primary)]">{hoveredWard.drainage}%</b>
            </div>
            <div>
              Rainfall: <b className="text-[var(--text-primary)]">{hoveredWard.rainfall} mm</b>
            </div>
          </div>
          <div className="text-[9px] text-[var(--brand)] mt-1.5 font-medium">
            Click polygon to view live telemetry →
          </div>
        </div>
      )}

      {/* Map Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1 bg-[var(--surface-elevated)]/90 backdrop-blur-md p-1 border border-[var(--border)] shadow-md">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.25, 4.5))}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.8))}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer"
          title="Reset Overview"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Keyless Architecture Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-20 px-2.5 py-1 bg-[var(--surface-elevated)]/90 backdrop-blur-md border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse" />
        <span>Vector GIS Engine • 100% Offline &amp; Keyless</span>
      </div>

      {/* Theme-Adaptive Risk Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-[var(--surface-elevated)]/95 backdrop-blur-md p-3 rounded-none border border-[var(--border)] text-xs shadow-md">
        <div className="font-bold text-[var(--text-primary)] mb-2 text-[10px] uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-3 h-3 text-[var(--brand)]" />
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
              <span className="text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-[var(--text-muted)] text-[9px] font-mono">({item.range})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drag & Zoom Instruction Badge (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-20 hidden sm:flex items-center space-x-1.5 px-2 py-1 bg-[var(--surface-elevated)]/80 backdrop-blur-sm border border-[var(--border)] text-[9px] font-mono text-[var(--text-muted)]">
        <MapPin className="w-2.5 h-2.5 text-[var(--brand)]" />
        <span>Drag to pan · Scroll to zoom · Click to select</span>
      </div>
    </div>
  );
}
