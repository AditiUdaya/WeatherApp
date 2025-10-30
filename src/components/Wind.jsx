import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './wind.css';

const WindAnalysis = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const particleSystemRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);

  const [particleCount, setParticleCount] = useState(50000);
  const [particleSpeed, setParticleSpeed] = useState(1.0);
  const [fadeSpeed, setFadeSpeed] = useState(0.96);
  const [isPlaying, setIsPlaying] = useState(true);

  // Vertex Shader - Handles particle position
  const vertexShader = `
    attribute vec3 velocity;
    attribute float life;
    
    varying float vLife;
    varying vec3 vVelocity;
    
    void main() {
      vLife = life;
      vVelocity = velocity;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 2.5 * (1.0 / -mvPosition.z) * 100.0;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  // Fragment Shader - Handles particle appearance and color
  const fragmentShader = `
    varying float vLife;
    varying vec3 vVelocity;
    
    void main() {
      // Create circular particles
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Color based on velocity magnitude (speed)
      float speed = length(vVelocity);
      
      // Color gradient: blue (slow) -> cyan -> green -> yellow -> red (fast)
      vec3 color;
      if (speed < 0.5) {
        color = mix(vec3(0.2, 0.3, 0.8), vec3(0.0, 0.8, 0.8), speed * 2.0);
      } else if (speed < 1.0) {
        color = mix(vec3(0.0, 0.8, 0.8), vec3(0.0, 1.0, 0.3), (speed - 0.5) * 2.0);
      } else if (speed < 1.5) {
        color = mix(vec3(0.0, 1.0, 0.3), vec3(1.0, 1.0, 0.0), (speed - 1.0) * 2.0);
      } else {
        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.2, 0.0), min((speed - 1.5) * 0.8, 1.0));
      }
      
      // Fade based on particle life
      float alpha = vLife * (1.0 - dist * 2.0);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Generate sample wind field data
  const generateWindField = () => {
    const gridSize = 32;
    const windField = new Float32Array(gridSize * gridSize * gridSize * 3);
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        for (let k = 0; k < gridSize; k++) {
          const idx = (i * gridSize * gridSize + j * gridSize + k) * 3;
          
          const x = (i / gridSize) * 2 - 1;
          const y = (j / gridSize) * 2 - 1;
          const z = (k / gridSize) * 2 - 1;
          
          // Create interesting wind patterns (vortex + wave)
          const angle = Math.atan2(y, x);
          const radius = Math.sqrt(x * x + y * y);
          const vortexStrength = Math.exp(-radius * 2);
          
          windField[idx] = -Math.sin(angle) * vortexStrength + Math.sin(y * 3 + z * 2) * 0.3;
          windField[idx + 1] = Math.cos(angle) * vortexStrength + Math.cos(x * 3) * 0.3;
          windField[idx + 2] = Math.sin(x * 2 + y * 2) * 0.5 + z * 0.2;
        }
      }
    }
    
    return { data: windField, gridSize };
  };

  // Sample wind field at a given position
  const sampleWindField = (position, windField) => {
    const { data, gridSize } = windField;
    const bounds = 2.0;
    
    // Normalize position to grid coordinates
    const x = ((position.x / bounds + 1) / 2) * (gridSize - 1);
    const y = ((position.y / bounds + 1) / 2) * (gridSize - 1);
    const z = ((position.z / bounds + 1) / 2) * (gridSize - 1);
    
    // Trilinear interpolation
    const x0 = Math.floor(x), x1 = Math.min(x0 + 1, gridSize - 1);
    const y0 = Math.floor(y), y1 = Math.min(y0 + 1, gridSize - 1);
    const z0 = Math.floor(z), z1 = Math.min(z0 + 1, gridSize - 1);
    
    const xd = x - x0, yd = y - y0, zd = z - z0;
    
    const getWind = (i, j, k) => {
      const idx = (i * gridSize * gridSize + j * gridSize + k) * 3;
      return new THREE.Vector3(data[idx], data[idx + 1], data[idx + 2]);
    };
    
    const c000 = getWind(x0, y0, z0);
    const c001 = getWind(x0, y0, z1);
    const c010 = getWind(x0, y1, z0);
    const c011 = getWind(x0, y1, z1);
    const c100 = getWind(x1, y0, z0);
    const c101 = getWind(x1, y0, z1);
    const c110 = getWind(x1, y1, z0);
    const c111 = getWind(x1, y1, z1);
    
    const c00 = c000.clone().lerp(c001, zd);
    const c01 = c010.clone().lerp(c011, zd);
    const c10 = c100.clone().lerp(c101, zd);
    const c11 = c110.clone().lerp(c111, zd);
    
    const c0 = c00.lerp(c01, yd);
    const c1 = c10.lerp(c11, yd);
    
    return c0.lerp(c1, xd);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    sceneRef.current = scene;

    // Get container dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    console.log('Three.js initialized:', { width, height, particles: particleCount });

    // Generate wind field
    const windField = generateWindField();

    // Particle system
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lives = new Float32Array(particleCount);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
      
      lives[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!isPlaying) {
        renderer.render(scene, camera);
        return;
      }

      timeRef.current += 0.016;

      const positions = particleSystem.geometry.attributes.position.array;
      const velocities = particleSystem.geometry.attributes.velocity.array;
      const lives = particleSystem.geometry.attributes.life.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        const position = new THREE.Vector3(
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2]
        );

        // Sample wind at particle position
        const wind = sampleWindField(position, windField);

        // Update velocity
        velocities[i3] = wind.x * particleSpeed;
        velocities[i3 + 1] = wind.y * particleSpeed;
        velocities[i3 + 2] = wind.z * particleSpeed;

        // Update position
        positions[i3] += velocities[i3] * 0.016;
        positions[i3 + 1] += velocities[i3 + 1] * 0.016;
        positions[i3 + 2] += velocities[i3 + 2] * 0.016;

        // Update life (fade)
        lives[i] *= fadeSpeed;

        // Respawn dead particles
        if (lives[i] < 0.01 || 
            Math.abs(positions[i3]) > 2 || 
            Math.abs(positions[i3 + 1]) > 2 || 
            Math.abs(positions[i3 + 2]) > 2) {
          positions[i3] = (Math.random() - 0.5) * 4;
          positions[i3 + 1] = (Math.random() - 0.5) * 4;
          positions[i3 + 2] = (Math.random() - 0.5) * 4;
          lives[i] = 1.0;
        }
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.velocity.needsUpdate = true;
      particleSystem.geometry.attributes.life.needsUpdate = true;

      // Rotate camera slowly for better view
      const radius = 3;
      camera.position.x = Math.sin(timeRef.current * 0.1) * radius;
      camera.position.z = Math.cos(timeRef.current * 0.1) * radius;
      camera.position.y = Math.sin(timeRef.current * 0.05) * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    // Start animation
    animate();
    console.log('Animation started');

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      console.log('Cleanup complete');
    };
  }, [particleCount, particleSpeed, fadeSpeed, isPlaying]);

  return (
    <div className="weather-visualization">
      <div className="canvas-container" ref={containerRef} />
      
      <div className="controls-panel">
        <h2>Wind Flow Visualization</h2>
        
        <div className="control-group">
          <label>
            Particle Count: {particleCount.toLocaleString()}
            <input
              type="range"
              min="10000"
              max="100000"
              step="10000"
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            Flow Speed: {particleSpeed.toFixed(2)}x
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={particleSpeed}
              onChange={(e) => setParticleSpeed(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            Fade Speed: {fadeSpeed.toFixed(2)}
            <input
              type="range"
              min="0.90"
              max="0.99"
              step="0.01"
              value={fadeSpeed}
              onChange={(e) => setFadeSpeed(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="control-group">
          <button 
            className="play-button"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        <div className="legend">
          <h3>Wind Speed</h3>
          <div className="legend-gradient"></div>
          <div className="legend-labels">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindAnalysis;