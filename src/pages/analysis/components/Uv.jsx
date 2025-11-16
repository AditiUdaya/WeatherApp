import React, { useState, useEffect, useRef } from 'react';
import { Sun, Shield, AlertTriangle, Eye, Menu, X, Info, Clock } from 'lucide-react';

const UVIndex = () => {
  const canvasRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 40.7128, lon: -74.0060, name: "New York" });
  const [uvData, setUvData] = useState(null);
  const [currentTime, setCurrentTime] = useState(12);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const generateUVData = () => {
      const baseUV = Math.abs(Math.sin(selectedLocation.lat * 0.02)) * 11;
      const timeModifier = Math.sin(((currentTime - 6) / 12) * Math.PI);
      const uvIndex = Math.max(0, baseUV * timeModifier * (Math.random() * 0.3 + 0.85));
      
      let category, risk, color, protection, burnTime;
      
      if (uvIndex < 3) {
        category = "Low";
        risk = "Minimal danger";
        color = "#22c55e";
        protection = "Wear sunglasses on bright days";
        burnTime = "60+ min";
      } else if (uvIndex < 6) {
        category = "Moderate";
        risk = "Low risk";
        color = "#eab308";
        protection = "Sunscreen recommended";
        burnTime = "30-60 min";
      } else if (uvIndex < 8) {
        category = "High";
        risk = "Moderate risk";
        color = "#f97316";
        protection = "Sunscreen + protective clothing";
        burnTime = "15-30 min";
      } else if (uvIndex < 11) {
        category = "Very High";
        risk = "High risk of harm";
        color = "#ef4444";
        protection = "Extra protection required";
        burnTime = "10-15 min";
      } else {
        category = "Extreme";
        risk = "Very high risk";
        color = "#a855f7";
        protection = "Avoid sun exposure";
        burnTime = "<10 min";
      }

      setUvData({
        index: uvIndex.toFixed(1),
        category,
        risk,
        color,
        protection,
        burnTime,
        cloudCover: Math.random() * 30,
        ozone: 300 + Math.random() * 100
      });
    };

    generateUVData();
  }, [selectedLocation, currentTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uvData) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    
    let frame = 0;
    
    // Dynamic animation parameters based on UV index
    const getAnimationParams = () => {
      const uv = parseFloat(uvData?.index || 5);
      
      if (uv < 3) {
        // Low UV - gentle, sparse sun rays
        return {
          rayCount: 8,
          particleCount: 20,
          speed: 0.008,
          rayLength: 150,
          rayIntensity: 0.2,
          gradientColors: [
            'rgba(34, 211, 238, 0.15)',   // cyan
            'rgba(251, 191, 36, 0.1)',    // yellow
            'rgba(74, 222, 128, 0.1)',    // green
            'rgba(15, 23, 42, 0)'
          ],
          particleColor: 'rgba(251, 191, 36, 0.4)',
          rayColor: 'rgba(251, 191, 36, 0.25)'
        };
      } else if (uv < 6) {
        // Moderate UV - moderate sun activity
        return {
          rayCount: 10,
          particleCount: 30,
          speed: 0.01,
          rayLength: 180,
          rayIntensity: 0.25,
          gradientColors: [
            'rgba(251, 191, 36, 0.18)',
            'rgba(249, 115, 22, 0.12)',
            'rgba(234, 179, 8, 0.1)',
            'rgba(15, 23, 42, 0)'
          ],
          particleColor: 'rgba(251, 191, 36, 0.5)',
          rayColor: 'rgba(251, 191, 36, 0.3)'
        };
      } else if (uv < 8) {
        // High UV - intense sun rays
        return {
          rayCount: 12,
          particleCount: 40,
          speed: 0.012,
          rayLength: 200,
          rayIntensity: 0.3,
          gradientColors: [
            'rgba(249, 115, 22, 0.2)',
            'rgba(251, 191, 36, 0.15)',
            'rgba(239, 68, 68, 0.1)',
            'rgba(15, 23, 42, 0)'
          ],
          particleColor: 'rgba(249, 115, 22, 0.6)',
          rayColor: 'rgba(249, 115, 22, 0.35)'
        };
      } else if (uv < 11) {
        // Very High UV - strong, vibrant rays
        return {
          rayCount: 14,
          particleCount: 50,
          speed: 0.014,
          rayLength: 220,
          rayIntensity: 0.35,
          gradientColors: [
            'rgba(239, 68, 68, 0.22)',
            'rgba(249, 115, 22, 0.18)',
            'rgba(220, 38, 38, 0.12)',
            'rgba(15, 23, 42, 0)'
          ],
          particleColor: 'rgba(239, 68, 68, 0.65)',
          rayColor: 'rgba(239, 68, 68, 0.4)'
        };
      } else {
        // Extreme UV - dangerous, pulsing rays
        return {
          rayCount: 16,
          particleCount: 60,
          speed: 0.016,
          rayLength: 250,
          rayIntensity: 0.4,
          gradientColors: [
            'rgba(168, 85, 247, 0.25)',   // purple
            'rgba(239, 68, 68, 0.22)',    // red
            'rgba(220, 38, 38, 0.15)',    // dark red
            'rgba(15, 23, 42, 0)'
          ],
          particleColor: 'rgba(168, 85, 247, 0.7)',
          rayColor: 'rgba(168, 85, 247, 0.45)'
        };
      }
    };
    
    const animate = () => {
      const params = getAnimationParams();
      frame += params.speed;
      
      ctx.clearRect(0, 0, width, height);
      
      // Radial gradient background
      const gradient = ctx.createRadialGradient(
        width / 2, height / 3, 0,
        width / 2, height / 3, width
      );
      
      gradient.addColorStop(0, params.gradientColors[0]);
      gradient.addColorStop(0.3, params.gradientColors[1]);
      gradient.addColorStop(0.6, params.gradientColors[2]);
      gradient.addColorStop(1, params.gradientColors[3]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Animated sun rays
      const centerX = width / 2;
      const centerY = height / 3;
      
      for (let i = 0; i < params.rayCount; i++) {
        const angle = (i / params.rayCount) * Math.PI * 2 + frame;
        const length = params.rayLength + Math.sin(frame * 2 + i) * 50;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        const rayGradient = ctx.createLinearGradient(0, 0, 0, length);
        rayGradient.addColorStop(0, params.rayColor);
        rayGradient.addColorStop(1, params.rayColor.replace(/[\d.]+\)$/g, '0)'));
        
        ctx.fillStyle = rayGradient;
        ctx.fillRect(-3, 0, 6, length);
        ctx.restore();
      }
      
      // Glowing particles - density based on UV intensity
      for (let i = 0; i < params.particleCount; i++) {
        const x = centerX + Math.cos(i + frame) * (150 + i * 10);
        const y = centerY + Math.sin(i + frame) * (150 + i * 10);
        const size = Math.sin(i * 0.5 + frame * 2) * 2 + 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${params.particleColor.slice(0, -4)}${0.4 + Math.sin(i + frame * 2) * 0.3})`;
        ctx.fill();
      }
      
      // Additional pulsing effect for extreme UV
      if (parseFloat(uvData?.index || 5) >= 11) {
        const pulseRadius = 100 + Math.sin(frame * 3) * 30;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + Math.sin(frame * 3) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      setAnimationFrame(requestAnimationFrame(animate));
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrame);
  }, [uvData]);

  const locations = [
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    { name: "Miami", lat: 25.7617, lon: -80.1918 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  ];

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/90 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sun className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">UV Index Monitor</h1>
              <p className="text-xs text-yellow-300">Solar Radiation & Health Risk Analysis</p>
            </div>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-yellow-400 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="absolute top-20 right-4 z-30 w-80 bg-slate-800/95 backdrop-blur-md rounded-xl p-5 border border-yellow-500/30 shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-yellow-400">About UV Index</h3>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-300 space-y-2">
            <p>The UV Index measures the strength of ultraviolet radiation from the sun at a particular place and time.</p>
            <p className="font-semibold text-white">Risk Categories:</p>
            <ul className="space-y-1 text-xs">
              <li><span className="text-green-400">• 0-2:</span> Low risk</li>
              <li><span className="text-yellow-400">• 3-5:</span> Moderate risk</li>
              <li><span className="text-orange-400">• 6-7:</span> High risk</li>
              <li><span className="text-red-400">• 8-10:</span> Very high risk</li>
              <li><span className="text-purple-400">• 11+:</span> Extreme risk</li>
            </ul>
            <p className="text-xs italic mt-2">UV exposure can cause skin cancer and eye damage. Always use protection.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-4 top-24 z-30 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white transition-all"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className={`absolute left-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-r border-yellow-500/30 transition-transform duration-300 z-10 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 mt-20 space-y-6">
          <div>
            <label className="text-sm font-semibold text-yellow-400 mb-2 block">Select Location</label>
            <select 
              value={selectedLocation.name}
              onChange={(e) => {
                const loc = locations.find(l => l.name === e.target.value);
                setSelectedLocation(loc);
              }}
              className="w-full bg-slate-800 text-white rounded-lg p-3 border border-yellow-500/30 focus:outline-none focus:border-yellow-400"
            >
              {locations.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time of Day: {currentTime}:00
            </label>
            <input
              type="range"
              min="6"
              max="20"
              value={currentTime}
              onChange={(e) => setCurrentTime(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>6:00</span>
              <span>20:00</span>
            </div>
          </div>

          {uvData && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-5 border-2" style={{ borderColor: uvData.color }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Current UV Index</span>
                  <Sun className="w-6 h-6" style={{ color: uvData.color }} />
                </div>
                <div className="text-5xl font-bold mb-2" style={{ color: uvData.color }}>
                  {uvData.index}
                </div>
                <div className="text-xl font-semibold mb-1" style={{ color: uvData.color }}>
                  {uvData.category}
                </div>
                <p className="text-sm text-gray-400">{uvData.risk}</p>
              </div>

              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Protection Needed</span>
                </div>
                <p className="text-sm text-gray-300">{uvData.protection}</p>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Time to Burn</span>
                </div>
                <div className="text-2xl font-bold text-orange-400">{uvData.burnTime}</div>
                <p className="text-xs text-gray-500 mt-1">For fair skin (Type II)</p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Cloud Cover</span>
                    <span className="text-sm font-semibold text-white">{uvData.cloudCover.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${uvData.cloudCover}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Ozone Layer</span>
                    <span className="text-sm font-semibold text-white">{uvData.ozone.toFixed(0)} DU</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Dobson Units</p>
                </div>
              </div>

              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-semibold text-blue-400">Eye Protection</h4>
                </div>
                <p className="text-xs text-gray-300">
                  UV rays can damage your eyes. Always wear UV-blocking sunglasses when outdoors during peak hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center">
          <div className="text-8xl font-bold text-white/10 mb-2">
            {uvData ? uvData.index : '--'}
          </div>
          <div className="text-2xl text-white/30">
            {selectedLocation.name}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-yellow-500/30 z-20">
        <h4 className="text-sm font-semibold text-yellow-400 mb-3">UV Risk Scale</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-green-500"></div>
            <span className="text-gray-300">Low (0-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-300">Moderate (3-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-orange-500"></div>
            <span className="text-gray-300">High (6-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-red-500"></div>
            <span className="text-gray-300">Very High (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-300">Extreme (11+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UVIndex;