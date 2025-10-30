import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cloud, Droplets, Thermometer, Wind, Activity } from 'lucide-react';

const Heatmap = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const heatmapMeshRef = useRef(null);
  
  const [dataType, setDataType] = useState('temperature');
  const [loading, setLoading] = useState(false);
  const [dataInfo, setDataInfo] = useState(null);

  // Temperature gradient colors (cold to hot)
  const tempColors = [
    { stop: 0.0, color: [0.1, 0.0, 0.4] },   // Deep blue (-40°C)
    { stop: 0.15, color: [0.0, 0.3, 0.8] },  // Blue (-20°C)
    { stop: 0.3, color: [0.0, 0.7, 0.9] },   // Cyan (0°C)
    { stop: 0.45, color: [0.2, 0.9, 0.5] },  // Green (10°C)
    { stop: 0.6, color: [0.9, 0.9, 0.2] },   // Yellow (20°C)
    { stop: 0.75, color: [0.95, 0.5, 0.0] }, // Orange (30°C)
    { stop: 0.9, color: [0.9, 0.0, 0.0] },   // Red (40°C)
    { stop: 1.0, color: [0.5, 0.0, 0.2] }    // Dark red (50°C)
  ];

  // Humidity gradient colors (dry to humid)
  const humidityColors = [
    { stop: 0.0, color: [0.8, 0.6, 0.4] },   // Brown (0%)
    { stop: 0.2, color: [0.9, 0.8, 0.5] },   // Tan (20%)
    { stop: 0.4, color: [0.7, 0.9, 0.6] },   // Light green (40%)
    { stop: 0.6, color: [0.3, 0.8, 0.7] },   // Teal (60%)
    { stop: 0.8, color: [0.2, 0.5, 0.9] },   // Blue (80%)
    { stop: 1.0, color: [0.1, 0.2, 0.6] }    // Deep blue (100%)
  ];

  // Generate synthetic weather data (replace with NOAA GFS data)
  const generateWeatherData = (type) => {
    const width = 360;
    const height = 180;
    const data = new Float32Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const lat = (y / height) * 180 - 90;
        const lon = (x / width) * 360 - 180;
        
        if (type === 'temperature') {
          // Temperature simulation: warmer at equator, colder at poles
          const latFactor = Math.cos((lat * Math.PI) / 180);
          const base = 15 + latFactor * 25;
          const noise = Math.sin(lon * 0.02) * Math.cos(lat * 0.05) * 10;
          data[idx] = base + noise;
        } else {
          // Humidity simulation: higher near equator and coasts
          const latFactor = 1 - Math.abs(lat) / 90;
          const oceanEffect = Math.sin(lon * 0.03) * Math.cos(lat * 0.04);
          data[idx] = 40 + latFactor * 40 + oceanEffect * 20;
        }
      }
    }
    
    return { data, width, height };
  };

  // Create color interpolation function
  const interpolateColor = (value, colorStops) => {
    for (let i = 0; i < colorStops.length - 1; i++) {
      const current = colorStops[i];
      const next = colorStops[i + 1];
      
      if (value >= current.stop && value <= next.stop) {
        const t = (value - current.stop) / (next.stop - current.stop);
        return [
          current.color[0] + (next.color[0] - current.color[0]) * t,
          current.color[1] + (next.color[1] - current.color[1]) * t,
          current.color[2] + (next.color[2] - current.color[2]) * t
        ];
      }
    }
    return colorStops[colorStops.length - 1].color;
  };

  // Create heatmap texture
  const createHeatmapTexture = (weatherData, colorGradient) => {
    const { data, width, height } = weatherData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    
    // Find min/max for normalization
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      min = Math.min(min, data[i]);
      max = Math.max(max, data[i]);
    }
    
    setDataInfo({ min: min.toFixed(1), max: max.toFixed(1) });
    
    // Fill texture
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - min) / (max - min);
      const color = interpolateColor(normalized, colorGradient);
      const idx = i * 4;
      imageData.data[idx] = color[0] * 255;
      imageData.data[idx + 1] = color[1] * 255;
      imageData.data[idx + 2] = color[2] * 255;
      imageData.data[idx + 3] = 200; // Slight transparency
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere for heatmap
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    heatmapMeshRef.current = mesh;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(4, 20, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (heatmapMeshRef.current) {
        heatmapMeshRef.current.rotation.y += 0.002;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      if (heatmapMeshRef.current) {
        heatmapMeshRef.current.rotation.y += deltaX * 0.005;
        heatmapMeshRef.current.rotation.x += deltaY * 0.005;
      }
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.002;
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update heatmap when data type changes
  useEffect(() => {
    if (!heatmapMeshRef.current) return;

    setLoading(true);
    
    // Simulate data loading
    setTimeout(() => {
      const weatherData = generateWeatherData(dataType);
      const colorGradient = dataType === 'temperature' ? tempColors : humidityColors;
      const texture = createHeatmapTexture(weatherData, colorGradient);
      
      heatmapMeshRef.current.material.map = texture;
      heatmapMeshRef.current.material.needsUpdate = true;
      
      setLoading(false);
    }, 300);
  }, [dataType]);

  // Create legend
  const createLegend = () => {
    const colors = dataType === 'temperature' ? tempColors : humidityColors;
    const unit = dataType === 'temperature' ? '°C' : '%';
    
    return (
      <div className="absolute bottom-6 left-6 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          {dataType === 'temperature' ? <Thermometer size={16} /> : <Droplets size={16} />}
          {dataType === 'temperature' ? 'Temperature' : 'Humidity'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex flex-col text-xs text-gray-400">
            <span>{dataInfo?.max}{unit}</span>
            <span className="mt-8">{dataInfo?.min}{unit}</span>
          </div>
          <div
            className="w-6 h-32 rounded"
            style={{
              background: `linear-gradient(to bottom, ${colors.map((c, i) => 
                `rgb(${c.color[0] * 255}, ${c.color[1] * 255}, ${c.color[2] * 255}) ${c.stop * 100}%`
              ).join(', ')})`
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed insert-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900/80 to-transparent p-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Activity className="text-blue-400" size={32} />
          NOAA GFS Weather Heatmap
        </h1>
        <p className="text-gray-300 text-sm">Scientific Weather Analysis & Visualization</p>
      </div>

      {/* Controls */}
      <div className="absolute top-28 left-6 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-3">Data Layer</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setDataType('temperature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              dataType === 'temperature'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Thermometer size={18} />
            Temperature
          </button>
          <button
            onClick={() => setDataType('humidity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              dataType === 'humidity'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Droplets size={18} />
            Humidity
          </button>
        </div>
      </div>

      {/* Legend */}
      {dataInfo && createLegend()}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-gray-900/90 rounded-lg p-6 flex items-center gap-3">
            <Cloud className="animate-pulse text-blue-400" size={24} />
            <span className="text-white font-medium">Loading weather data...</span>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default Heatmap;