import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Compass, RotateCw, MapPin, Eye } from 'lucide-react';

// Real-world continental outlines in [longitude, latitude] degrees
const CONTINENTS = [
  // Eurasia
  [
    [-10, 36], [0, 36], [10, 38], [25, 40], [30, 42], [40, 40], [50, 30], [60, 25],
    [68, 24], [72, 20], [76, 10], [80, 13], [88, 22], [92, 16], [100, 14], [104, 10],
    [108, 14], [120, 23], [122, 32], [130, 42], [140, 50], [170, 65], [175, 70],
    [150, 74], [110, 76], [80, 75], [60, 72], [40, 70], [28, 70], [20, 60],
    [12, 55], [5, 53], [0, 45], [-8, 44], [-10, 36]
  ],
  // Indian Subcontinent (High detail)
  [
    [68, 24], [70, 27], [74, 32], [76, 35], [78, 35], [80, 30], [84, 28], [88, 26],
    [92, 25], [90, 22], [86, 20], [82, 17], [80, 13], [78, 9], [77, 8], [76, 9],
    [74, 12], [73, 16], [70, 21], [68, 24]
  ],
  // Africa
  [
    [-17, 15], [-12, 28], [-5, 36], [10, 37], [25, 32], [32, 31], [43, 12], [51, 12],
    [48, 5], [42, -5], [38, -15], [35, -20], [28, -33], [24, -34], [18, -34], [12, -18],
    [9, 5], [2, 6], [-10, 8], [-17, 15]
  ],
  // North America
  [
    [-168, 65], [-150, 60], [-135, 54], [-125, 50], [-125, 38], [-117, 32], [-105, 20],
    [-97, 18], [-90, 16], [-83, 9], [-77, 8], [-80, 25], [-81, 30], [-70, 42],
    [-60, 46], [-64, 58], [-75, 62], [-85, 65], [-95, 70], [-130, 72], [-168, 65]
  ],
  // South America
  [
    [-80, 9], [-75, 11], [-60, 5], [-50, -2], [-35, -6], [-37, -12], [-41, -21],
    [-48, -28], [-55, -35], [-68, -54], [-73, -52], [-75, -50], [-72, -40], [-70, -18],
    [-77, -12], [-81, -5], [-80, 9]
  ],
  // Australia
  [
    [113, -22], [115, -34], [120, -35], [130, -32], [138, -35], [146, -39], [151, -34],
    [153, -28], [145, -15], [136, -12], [128, -15], [120, -18], [113, -22]
  ],
  // Japan & East Islands
  [
    [130, 32], [135, 35], [141, 40], [142, 44], [138, 42], [132, 34], [130, 32]
  ],
  // Great Britain & Ireland
  [
    [-5, 50], [0, 52], [1, 56], [-3, 58], [-6, 55], [-5, 50]
  ]
];

// Telemetry Partner Stations connected to Delhi NCT via hydrological data arcs
const TELEMETRY_STATIONS = [
  { name: 'GENEVA · WMO', lat: 46.2044, lon: 6.1432 },
  { name: 'TOKYO · RIVER TECH', lat: 35.6762, lon: 139.6503 },
  { name: 'LONDON · THAMES BARRIER', lat: 51.4977, lon: 0.0369 },
  { name: 'SINGAPORE · PUB HYDRO', lat: 1.3521, lon: 103.8198 }
];

// Coordinates: Delhi NCT (National Capital Territory)
const DELHI_COORDS = { lat: 28.6139, lon: 77.2090 };

export default function LightModeEarthGlobe({ className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [targetFocus, setTargetFocus] = useState(null);

  // Helper: Convert Lat/Lon to 3D Cartesian Vector on Sphere of radius R
  const latLonToVector3 = useCallback((lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Helper: Create high-resolution Light Mode Earth canvas texture
  const createLightEarthTexture = useCallback(() => {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Pristine ocean base: Soft luminous sky gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#f0f9ff'); // Sky 50
    oceanGrad.addColorStop(0.5, '#e0f2fe'); // Sky 100
    oceanGrad.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Tactical Graticule: Latitude & Longitude grid lines
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
    ctx.lineWidth = 1;
    // Parallels (Latitude lines every 15 deg)
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Meridians (Longitude lines every 30 deg)
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Continental Landmasses
    CONTINENTS.forEach((polygon) => {
      ctx.beginPath();
      polygon.forEach(([lon, lat], idx) => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // Landmass fill: Polished, modern cool light slate/cyan tone
      ctx.fillStyle = '#bae6fd'; // Sky 200
      ctx.fill();

      // Coastline stroke: Crisp cyan/sky boundary
      ctx.strokeStyle = '#0284c7'; // Sky 600
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 4. Dot-Matrix Geo Overlay on Land
    // Creates that high-end Stripe / Linear radar feel
    ctx.fillStyle = '#0369a1';
    for (let y = 30; y < height - 30; y += 14) {
      const lat = 90 - (y / height) * 180;
      for (let x = 10; x < width - 10; x += 14) {
        const lon = (x / width) * 360 - 180;
        // Check if inside any continent bounding area
        let isLand = false;
        for (const poly of CONTINENTS) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          for (const [pLon, pLat] of poly) {
            if (pLon < minX) minX = pLon;
            if (pLon > maxX) maxX = pLon;
            if (pLat < minY) minY = pLat;
            if (pLat > maxY) maxY = pLat;
          }
          if (lon >= minX && lon <= maxX && lat >= minY && lat <= maxY) {
            isLand = true;
            break;
          }
        }
        if (isLand) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
          ctx.fill();
        }
      }
    }

    // 5. Delhi NCT Radar Ping on the 2D surface
    const delhiX = ((DELHI_COORDS.lon + 180) / 360) * width;
    const delhiY = ((90 - DELHI_COORDS.lat) / 180) * height;

    const radialPulse = ctx.createRadialGradient(delhiX, delhiY, 0, delhiX, delhiY, 28);
    radialPulse.addColorStop(0, 'rgba(14, 165, 233, 0.9)');
    radialPulse.addColorStop(0.4, 'rgba(2, 132, 199, 0.5)');
    radialPulse.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = radialPulse;
    ctx.beginPath();
    ctx.arc(delhiX, delhiY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Center focal point dot
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(delhiX, delhiY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene Setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5.4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Master Globe Group for Smooth Rotation
    const globeGroup = new THREE.Group();
    // Default Delhi focal tilt
    globeGroup.rotation.x = 0.22;
    globeGroup.rotation.y = -2.25;
    scene.add(globeGroup);

    // 1. Earth Sphere Core
    const sphereRadius = 2.0;
    const earthGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const earthTexture = createLightEarthTexture();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.38,
      metalness: 0.08,
      color: 0xffffff
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 2. Luminous Atmospheric Rim Glow
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius * 1.025, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Outer soft halo
    const haloGeometry = new THREE.SphereGeometry(sphereRadius * 1.07, 64, 64);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    globeGroup.add(haloMesh);

    // 3. Tilted Orbital Telemetry Rings
    const ringGroup = new THREE.Group();
    globeGroup.add(ringGroup);

    // Orbital Ring 1: Primary Ellipse
    const orbitCurve1 = new THREE.EllipseCurve(
      0, 0,
      sphereRadius * 1.34, sphereRadius * 1.34,
      0, 2 * Math.PI,
      false,
      0
    );
    const points1 = orbitCurve1.getPoints(128);
    const ringGeom1 = new THREE.BufferGeometry().setFromPoints(
      points1.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      linewidth: 1.5
    });
    const ringLine1 = new THREE.Line(ringGeom1, ringMat1);
    ringLine1.rotation.x = Math.PI / 3.2;
    ringLine1.rotation.z = Math.PI / 6;
    ringGroup.add(ringLine1);

    // Orbital Ring 2: Equatorial Transverse Ellipse
    const orbitCurve2 = new THREE.EllipseCurve(
      0, 0,
      sphereRadius * 1.48, sphereRadius * 1.48,
      0, 2 * Math.PI,
      false,
      0
    );
    const points2 = orbitCurve2.getPoints(128);
    const ringGeom2 = new THREE.BufferGeometry().setFromPoints(
      points2.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const ringMat2 = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      linewidth: 1
    });
    const ringLine2 = new THREE.Line(ringGeom2, ringMat2);
    ringLine2.rotation.x = -Math.PI / 4;
    ringLine2.rotation.y = Math.PI / 5;
    ringGroup.add(ringLine2);

    // 4. Orbiting Telemetry Satellites
    const satGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const satMaterial = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const satMesh1 = new THREE.Mesh(satGeometry, satMaterial);
    ringGroup.add(satMesh1);

    const satMesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ringGroup.add(satMesh2);

    // 5. Delhi NCT 3D Focal Radar Beacon
    const delhiVec = latLonToVector3(DELHI_COORDS.lat, DELHI_COORDS.lon, sphereRadius);

    // Delhi Base Ring Ripple
    const rippleRadius = 0.08;
    const rippleGeometry = new THREE.RingGeometry(0.015, rippleRadius, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
    rippleMesh.position.copy(delhiVec);
    rippleMesh.lookAt(delhiVec.clone().multiplyScalar(2));
    globeGroup.add(rippleMesh);

    // Delhi Outward Beacon Beam
    const beamHeight = 0.35;
    const beamCurve = new THREE.LineCurve3(
      delhiVec,
      delhiVec.clone().add(delhiVec.clone().normalize().multiplyScalar(beamHeight))
    );
    const beamGeometry = new THREE.TubeGeometry(beamCurve, 16, 0.009, 8, false);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.95
    });
    const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
    globeGroup.add(beamMesh);

    // Delhi Beacon Tip Sphere
    const tipPos = delhiVec.clone().add(delhiVec.clone().normalize().multiplyScalar(beamHeight));
    const tipMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x0369a1 })
    );
    tipMesh.position.copy(tipPos);
    globeGroup.add(tipMesh);

    // 6. Global Telemetry Partner Arcs
    TELEMETRY_STATIONS.forEach((station) => {
      const stationVec = latLonToVector3(station.lat, station.lon, sphereRadius);

      // Station beacon dot
      const stDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75 })
      );
      stDot.position.copy(stationVec);
      globeGroup.add(stDot);

      // 3D Arc Curve from Delhi to Station
      const mid = delhiVec.clone().add(stationVec).multiplyScalar(0.5);
      const arcAltitude = sphereRadius * (1.18 + Math.random() * 0.08);
      mid.normalize().multiplyScalar(arcAltitude);

      const curve = new THREE.QuadraticBezierCurve3(delhiVec, mid, stationVec);
      const curvePoints = curve.getPoints(40);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        linewidth: 1
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      globeGroup.add(arcLine);
    });

    // 7. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, -3, -4);
    scene.add(rimLight);

    // 8. Interaction: Pointer Drag & Momentum Rotation
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velX = 0;
    let velY = 0;
    const autoSpinSpeed = 0.0018;

    const onPointerDown = (e) => {
      isPointerDown = true;
      setIsInteracting(true);
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      velX = 0;
      velY = 0;
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      velX = deltaX * 0.004;
      velY = deltaY * 0.004;

      globeGroup.rotation.y += velX;
      globeGroup.rotation.x += velY;

      // Restrict pole flips
      globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x));
    };

    const onPointerUp = () => {
      isPointerDown = false;
      setIsInteracting(false);
    };

    const canvasElement = canvasRef.current;
    canvasElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Inertia & Auto Rotation
      if (!isPointerDown) {
        velX *= 0.94;
        velY *= 0.94;
        globeGroup.rotation.y += velX + autoSpinSpeed;
        globeGroup.rotation.x += velY;
        globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x));
      }

      // Animate Delhi Radar Ripple (Pulsing expanding wave)
      const rippleScale = 1 + (Math.sin(elapsedTime * 3.5) + 1) * 0.6;
      rippleMesh.scale.set(rippleScale, rippleScale, 1);
      rippleMaterial.opacity = 0.9 - (rippleScale - 1) * 0.6;

      // Animate Satellites along Orbits
      const satAngle1 = elapsedTime * 0.45;
      const r1 = sphereRadius * 1.34;
      satMesh1.position.set(
        Math.cos(satAngle1) * r1,
        0,
        Math.sin(satAngle1) * r1
      );

      const satAngle2 = -elapsedTime * 0.38 + 1.2;
      const r2 = sphereRadius * 1.48;
      satMesh2.position.set(
        Math.cos(satAngle2) * r2,
        0,
        Math.sin(satAngle2) * r2
      );

      // Delhi Focus Tweening (if triggered)
      if (targetFocus) {
        globeGroup.rotation.y += (targetFocus.y - globeGroup.rotation.y) * 0.08;
        globeGroup.rotation.x += (targetFocus.x - globeGroup.rotation.x) * 0.08;
        if (
          Math.abs(targetFocus.y - globeGroup.rotation.y) < 0.005 &&
          Math.abs(targetFocus.x - globeGroup.rotation.x) < 0.005
        ) {
          setTargetFocus(null);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvasElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      ringGeom1.dispose();
      ringMat1.dispose();
      ringGeom2.dispose();
      ringMat2.dispose();
      satGeometry.dispose();
      satMaterial.dispose();
      rippleGeometry.dispose();
      rippleMaterial.dispose();
      beamGeometry.dispose();
      beamMaterial.dispose();
      renderer.dispose();
    };
  }, [createLightEarthTexture, latLonToVector3, targetFocus]);

  // Handler: Focus camera directly onto Delhi NCT
  const handleFocusDelhi = () => {
    setTargetFocus({ x: 0.22, y: -2.25 });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      {/* Soft Ambient Radial Vignette for pristine Light Mode depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_68%_50%,rgba(14,165,233,0.14)_0%,rgba(56,189,248,0.06)_40%,transparent_70%)]" />

      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none z-10"
      />

      {/* Tactical Floating HUD Badges (Top-Right of Globe) */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col items-end gap-2 font-mono text-[11px] pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/85 border border-sky-200/80 shadow-sm backdrop-blur-md text-slate-700">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="font-semibold text-sky-950">ORBITAL OBSERVATORY</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">SRID 4326</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/80 border border-sky-100 text-[10px] text-sky-800">
          <MapPin className="w-3 h-3 text-sky-600" />
          <span>DELHI NCT · 28.6139° N, 77.2090° E</span>
        </div>
      </div>

      {/* Floating Tactical Interaction Controls (Bottom-Right of Globe) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleFocusDelhi}
          title="Reset View to Delhi NCT"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 font-mono text-xs shadow-xs transition-all backdrop-blur-md active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-3 h-3 text-sky-600" />
          <span>Focus Delhi</span>
        </button>

        <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-[10px] font-mono text-slate-500 backdrop-blur-md">
          <Compass className="w-3 h-3 text-slate-400" />
          <span>Drag to Rotate</span>
        </div>
      </div>
    </div>
  );
}
