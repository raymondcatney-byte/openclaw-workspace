import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import EventPanel from './components/EventPanel';
import { CyberEvent, EVENT_COLORS, generateMockEvents, updateEvents } from './utils/eventData';
import { deerFlowClient } from './utils/deerflow-client';

// Event marker data stored for animation
interface MarkerData {
  sphere: THREE.Mesh;
  ring: THREE.Mesh;
  beam: THREE.Mesh;
  event: CyberEvent;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<CyberEvent[]>(generateMockEvents(15));
  const [webglError, setWebglError] = useState<string | null>(null);
  const [useDeerFlow, setUseDeerFlow] = useState(false);
  const [deerFlowConnected, setDeerFlowConnected] = useState(false);
  
  // Refs for Three.js objects that need to persist
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const markerMapRef = useRef<Map<number, MarkerData>>(new Map());
  const animationIdRef = useRef<number | null>(null);
  const eventsRef = useRef<CyberEvent[]>(events);
  
  // Interaction refs
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const cameraZRef = useRef(6);
  
  // Update events ref when state changes
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // DeerFlow integration
  useEffect(() => {
    if (!useDeerFlow) {
      deerFlowClient.disconnect();
      setDeerFlowConnected(false);
      return;
    }

    // Check DeerFlow health
    deerFlowClient.health().then((health) => {
      if (health) {
        setDeerFlowConnected(true);
        console.log('🦌 DeerFlow connected:', health);
        
        // Fetch initial events
        deerFlowClient.getEvents().then((events) => {
          if (events.length > 0) {
            setEvents(events);
          }
        });
        
        // Set up WebSocket for real-time updates
        deerFlowClient.onEvents((newEvents) => {
          setEvents(newEvents);
        });
        deerFlowClient.connect();
      } else {
        console.warn('🦌 DeerFlow not available, using mock data');
        setDeerFlowConnected(false);
      }
    });

    return () => {
      deerFlowClient.disconnect();
    };
  }, [useDeerFlow]);

  // Initialize Three.js scene (runs only once)
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6);
    cameraRef.current = camera;

    // Renderer setup with error handling
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (!renderer.getContext()) {
        throw new Error('WebGL context not available');
      }
    } catch (e) {
      console.error('WebGL initialization failed:', e);
      setWebglError('WebGL is not supported in this environment. Please use a WebGL-enabled browser.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe group (rotates together)
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a5c,  // Fallback blue color
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x0a1f2e,
      emissiveIntensity: 0.3,
    });
    
    // Load NASA Blue Marble texture with CORS handling
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = texture;
        earthMaterial.color = new THREE.Color(0xffffff);
        earthMaterial.needsUpdate = true;
        console.log('Earth texture loaded successfully');
      },
      undefined,
      (err) => {
        console.warn('Failed to load Earth texture, using fallback color:', err);
        // Keep the fallback blue color
      }
    );
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earth);

    // Outer atmosphere glow
    const outerGlowGeometry = new THREE.SphereGeometry(2.15, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    globeGroup.add(outerGlow);

    // Inner glow layer
    const innerGlowGeometry = new THREE.SphereGeometry(2.08, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00a8cc,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    globeGroup.add(innerGlow);

    // Marker group (child of globe group so markers rotate with globe)
    const markerGroup = new THREE.Group();
    markerGroupRef.current = markerGroup;
    globeGroup.add(markerGroup);

    // Grid lines
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
    });

    // Latitude lines (every 20 degrees from -80 to 80)
    for (let lat = -80; lat <= 80; lat += 20) {
      const phi = (90 - lat) * (Math.PI / 180);
      const radius = 2.03 * Math.sin(phi);
      const y = 2.03 * Math.cos(phi);
      
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          radius * Math.cos(theta),
          y,
          radius * Math.sin(theta)
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }

    // Longitude lines (every 20 degrees, full 360)
    for (let lng = 0; lng < 360; lng += 20) {
      const theta = lng * (Math.PI / 180);
      const points: THREE.Vector3[] = [];
      
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        points.push(new THREE.Vector3(
          2.03 * Math.sin(phi) * Math.cos(theta),
          2.03 * Math.cos(phi),
          2.03 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }

    scene.add(gridGroup);

    // Star field
    const starGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    const starColors: number[] = [];

    for (let i = 0; i < 2000; i++) {
      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 50 + Math.random() * 50;
      
      starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      
      // Brightness variation (0.5-1.0)
      const brightness = 0.5 + Math.random() * 0.5;
      starColors.push(brightness, brightness, brightness);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    starsRef.current = stars;
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1.5);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00d4ff, 0.3);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      
      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;
      
      // Clamp X rotation to ±π/2 (prevent flipping)
      targetRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationRef.current.x));
      
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraZRef.current += e.deltaY * 0.01;
      cameraZRef.current = Math.max(3, Math.min(10, cameraZRef.current));
    };

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Smooth rotation interpolation
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      // Apply rotation to globe
      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = currentRotationRef.current.x;
        globeGroupRef.current.rotation.y = currentRotationRef.current.y;

        // Auto-rotation when not dragging
        if (!isDraggingRef.current) {
          targetRotationRef.current.y += 0.0005;
        }
      }

      // Atmosphere rotation
      outerGlow.rotation.y += 0.0003;
      innerGlow.rotation.y -= 0.0002;

      // Stars rotation
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.00005;
      }

      // Update camera position
      if (cameraRef.current) {
        cameraRef.current.position.z += (cameraZRef.current - cameraRef.current.position.z) * 0.1;
      }

      // Update markers
      const currentEvents = eventsRef.current;
      markerMapRef.current.forEach((markerData, id) => {
        const event = currentEvents.find(e => e.id === id);
        if (event) {
          markerData.event = event;
          
          // Update pulsing ring
          const pulseScale = 1 + Math.sin(time * 3 + id) * 0.3;
          const pulseOpacity = (0.5 + Math.sin(time * 3 + id) * 0.3) * event.intensity;
          
          markerData.ring.scale.set(pulseScale, pulseScale, pulseScale);
          (markerData.ring.material as THREE.MeshBasicMaterial).opacity = pulseOpacity;
          
          // Ring always faces camera
          markerData.ring.lookAt(cameraRef.current?.position || new THREE.Vector3(0, 0, 6));
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      renderer?.domElement?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer?.domElement?.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      
      // Dispose geometries and materials
      markerMapRef.current.forEach((marker) => {
        marker.sphere.geometry.dispose();
        (marker.sphere.material as THREE.Material).dispose();
        marker.ring.geometry.dispose();
        (marker.ring.material as THREE.Material).dispose();
        marker.beam.geometry.dispose();
        (marker.beam.material as THREE.Material).dispose();
      });
      
      earthGeometry.dispose();
      earthMaterial.dispose();
      outerGlowGeometry.dispose();
      outerGlowMaterial.dispose();
      innerGlowGeometry.dispose();
      innerGlowMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      gridGroup.children.forEach((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
        }
      });
      
      renderer?.dispose();
      
      if (containerRef.current && renderer?.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Create/update markers when events change
  useEffect(() => {
    if (!markerGroupRef.current) return;

    const markerGroup = markerGroupRef.current;
    const markerMap = markerMapRef.current;

    // Add new markers
    events.forEach((event) => {
      if (!markerMap.has(event.id)) {
        const color = EVENT_COLORS[event.type];

        // Convert lat/lng to spherical coordinates
        const phi = (90 - event.lat) * (Math.PI / 180);
        const theta = (event.lng + 180) * (Math.PI / 180);
        
        const x = -(2.02 * Math.sin(phi) * Math.cos(theta));
        const y = 2.02 * Math.cos(phi);
        const z = 2.02 * Math.sin(phi) * Math.sin(theta);

        // Sphere marker
        const sphereGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x, y, z);

        // Pulsing ring
        const ringGeometry = new THREE.RingGeometry(0.03, 0.06, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5 * event.intensity,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(x, y, z);
        ring.lookAt(new THREE.Vector3(0, 0, 0));

        // Vertical beam
        const beamGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.3, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.4,
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beam extending outward from globe surface
        const direction = new THREE.Vector3(x, y, z).normalize();
        const beamPosition = direction.clone().multiplyScalar(2.02 + 0.15);
        beam.position.copy(beamPosition);
        beam.lookAt(new THREE.Vector3(0, 0, 0));
        beam.rotateX(Math.PI / 2);

        markerGroup.add(sphere);
        markerGroup.add(ring);
        markerGroup.add(beam);

        markerMap.set(event.id, { sphere, ring, beam, event });
      }
    });

    // Remove markers for events that no longer exist
    const eventIds = new Set(events.map(e => e.id));
    markerMap.forEach((marker, id) => {
      if (!eventIds.has(id)) {
        markerGroup.remove(marker.sphere);
        markerGroup.remove(marker.ring);
        markerGroup.remove(marker.beam);
        
        marker.sphere.geometry.dispose();
        (marker.sphere.material as THREE.Material).dispose();
        marker.ring.geometry.dispose();
        (marker.ring.material as THREE.Material).dispose();
        marker.beam.geometry.dispose();
        (marker.beam.material as THREE.Material).dispose();
        
        markerMap.delete(id);
      }
    });
  }, [events]);

  // Update events every 3 seconds (only when not using DeerFlow)
  useEffect(() => {
    if (useDeerFlow) return; // DeerFlow handles updates via WebSocket
    
    const interval = setInterval(() => {
      setEvents((prevEvents) => updateEvents(prevEvents));
    }, 3000);

    return () => clearInterval(interval);
  }, [useDeerFlow]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {webglError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-slate-800/90 border border-cyan-500/30 rounded-lg p-8 max-w-md text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-cyan-400 mb-2">3D Globe Ready</h2>
            <p className="text-slate-300 text-sm mb-4">{webglError}</p>
            <p className="text-slate-400 text-xs">
              The cyber globe is fully built and running at:
              <br />
              <span className="text-cyan-400 font-mono">http://localhost:5173</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="absolute inset-0" />
          <EventPanel events={events} />
          
          {/* DeerFlow Toggle */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setUseDeerFlow(!useDeerFlow)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                useDeerFlow 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                  : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">
                {useDeerFlow ? '🦌 DeerFlow' : 'Mock Data'}
              </span>
              {deerFlowConnected && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
            {useDeerFlow && !deerFlowConnected && (
              <p className="mt-2 text-xs text-amber-400">
                ⚠️ DeerFlow API not available. Run: python bridge/api_server.py --mock
              </p>
            )}
          </div>
          
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 text-slate-500 text-xs">
            <p>Click & drag to rotate • Scroll to zoom</p>
          </div>
        </>
      )}
    </div>
  );
}
