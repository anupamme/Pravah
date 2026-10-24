import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Compass, RotateCw, MapPin, Eye, Radio } from 'lucide-react';

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
  const [isInteracting, setIsInteracting] = useState(false);
  const [targetFocus, setTargetFocus] = useState(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // Helper: Convert Lat/Lon to 3D Cartesian Vector on Sphere of radius R
  const latLonToVector3 = useCallback((lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
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
    camera.position.set(0, 0, 5.2);

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
    // Default tilt centering the Indian Subcontinent towards the viewer
    globeGroup.rotation.x = 0.22;
    globeGroup.rotation.y = -2.25;
    scene.add(globeGroup);

    // Texture Loader with local high-resolution NASA satellite maps
    const textureLoader = new THREE.TextureLoader();

    // 1. Earth Sphere Core (Photorealistic Satellite Imagery)
    const sphereRadius = 2.0;
    const earthGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);

    const earthTexture = textureLoader.load(
      '/textures/planets/earth_atmos_2048.jpg',
      () => setTexturesLoaded(true)
    );
    const normalTexture = textureLoader.load('/textures/planets/earth_normal_2048.jpg');
    const specularTexture = textureLoader.load('/textures/planets/earth_specular_2048.jpg');

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: specularTexture,
      roughness: 0.65,
      metalness: 0.12,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 2. Realistic Dynamic Weather Clouds Layer
    const cloudTexture = textureLoader.load('/textures/planets/earth_clouds_1024.png');
    const cloudGeometry = new THREE.SphereGeometry(sphereRadius * 1.018, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      roughness: 1.0,
      metalness: 0.0
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudMesh);

    // 3. Rayleigh Atmospheric Horizon Halo (Soft Cyan/Sky Glow)
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius * 1.045, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Outer soft planetary aura
    const haloGeometry = new THREE.SphereGeometry(sphereRadius * 1.09, 64, 64);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    globeGroup.add(haloMesh);

    // 4. Subtle Tactical Graticule (Orbit Telemetry Ring)
    const ringGroup = new THREE.Group();
    globeGroup.add(ringGroup);

    const orbitCurve = new THREE.EllipseCurve(
      0, 0,
      sphereRadius * 1.36, sphereRadius * 1.36,
      0, 2 * Math.PI,
      false,
      0
    );
    const points = orbitCurve.getPoints(128);
    const ringGeom = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      linewidth: 1.5
    });
    const ringLine = new THREE.Line(ringGeom, ringMat);
    ringLine.rotation.x = Math.PI / 3.4;
    ringLine.rotation.z = Math.PI / 7;
    ringGroup.add(ringLine);

    // Satellite Mesh orbiting on ring
    const satGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const satMaterial = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const satMesh = new THREE.Mesh(satGeometry, satMaterial);
    ringGroup.add(satMesh);

    // 5. Delhi NCT 3D Focal Radar Beacon
    const delhiVec = latLonToVector3(DELHI_COORDS.lat, DELHI_COORDS.lon, sphereRadius * 1.02);

    // Delhi Base Ripple Rings
    const rippleRadius = 0.085;
    const rippleGeometry = new THREE.RingGeometry(0.015, rippleRadius, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
    rippleMesh.position.copy(delhiVec);
    rippleMesh.lookAt(delhiVec.clone().multiplyScalar(2));
    globeGroup.add(rippleMesh);

    // Delhi Vertical Beacon Beam
    const beamHeight = 0.36;
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

    // Delhi Beacon Glowing Tip
    const tipPos = delhiVec.clone().add(delhiVec.clone().normalize().multiplyScalar(beamHeight));
    const tipMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    tipMesh.position.copy(tipPos);
    globeGroup.add(tipMesh);

    // 6. Global Telemetry Partner Station Arcs
    TELEMETRY_STATIONS.forEach((station) => {
      const stationVec = latLonToVector3(station.lat, station.lon, sphereRadius * 1.02);

      const stDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75 })
      );
      stDot.position.copy(stationVec);
      globeGroup.add(stDot);

      const mid = delhiVec.clone().add(stationVec).multiplyScalar(0.5);
      const arcAltitude = sphereRadius * (1.18 + Math.random() * 0.06);
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

    // 7. Lighting (Realistic Daylight Space Lighting)
    // Sunlight: Powerful directional light creating crisp continental day colors
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(6, 4, 7);
    scene.add(sunLight);

    // Ambient light: Soft daylight atmosphere fill so shadowed regions stay soft and clear
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.1);
    scene.add(ambientLight);

    // Horizon rim light: Enhances the atmospheric limb
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 8. Interaction: Pointer Drag & Inertia Momentum
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velX = 0;
    let velY = 0;
    const autoSpinSpeed = 0.0016;

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

      velX = deltaX * 0.0035;
      velY = deltaY * 0.0035;

      globeGroup.rotation.y += velX;
      globeGroup.rotation.x += velY;

      // Restrict polar flips
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

      // Earth & Momentum Rotation
      if (!isPointerDown) {
        velX *= 0.94;
        velY *= 0.94;
        globeGroup.rotation.y += velX + autoSpinSpeed;
        globeGroup.rotation.x += velY;
        globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x));
      }

      // Independent Cloud Layer Rotation (Drifts smoothly for photorealism)
      cloudMesh.rotation.y += 0.00035;

      // Animate Delhi Radar Ripple
      const rippleScale = 1 + (Math.sin(elapsedTime * 3.5) + 1) * 0.6;
      rippleMesh.scale.set(rippleScale, rippleScale, 1);
      rippleMaterial.opacity = 0.9 - (rippleScale - 1) * 0.6;

      // Orbit Satellite
      const satAngle = elapsedTime * 0.42;
      const r = sphereRadius * 1.36;
      satMesh.position.set(
        Math.cos(satAngle) * r,
        0,
        Math.sin(satAngle) * r
      );

      // Delhi Focus Animation
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

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvasElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      satGeometry.dispose();
      satMaterial.dispose();
      rippleGeometry.dispose();
      rippleMaterial.dispose();
      beamGeometry.dispose();
      beamMaterial.dispose();
      renderer.dispose();
    };
  }, [latLonToVector3, targetFocus]);

  // Handler: Focus camera directly onto Delhi NCT
  const handleFocusDelhi = () => {
    setTargetFocus({ x: 0.22, y: -2.25 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      {/* Ambient Daylight Radial Glow behind the photorealistic Earth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_68%_50%,rgba(14,165,233,0.18)_0%,rgba(56,189,248,0.08)_40%,transparent_70%)]" />

      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none z-10"
      />

      {/* Tactical Floating HUD Badges */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col items-end gap-2 font-mono text-[11px] pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200/80 shadow-xs backdrop-blur-md text-slate-700">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="font-semibold text-sky-950">NASA BLUE MARBLE TELEMETRY</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">SRID 4326</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/90 border border-sky-100 text-[10px] text-sky-800 backdrop-blur-md">
          <MapPin className="w-3 h-3 text-sky-600" />
          <span>DELHI NCT · 28.6139° N, 77.2090° E</span>
        </div>
      </div>

      {/* Floating Tactical Interaction Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleFocusDelhi}
          title="Reset View to Delhi NCT"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 font-mono text-xs shadow-xs transition-all backdrop-blur-md active:scale-95 cursor-pointer"
        >
          <RotateCw className="w-3 h-3 text-sky-600" />
          <span>Focus Delhi</span>
        </button>

        <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/85 border border-slate-200/80 text-[10px] font-mono text-slate-500 backdrop-blur-md">
          <Compass className="w-3 h-3 text-slate-400" />
          <span>Drag to Rotate</span>
        </div>
      </div>
    </div>
  );
}
