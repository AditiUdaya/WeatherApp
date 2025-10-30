import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Thermometer, Wind, Cloud, Info, Menu, X } from 'lucide-react';

const DewPointVisualization = () => {
  const canvasRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 40.7128, lon: -74.0060, name: "New York" });
  const [dewPoint, setDewPoint] = useState(null);
  const [comfort, setComfort] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Generate realistic dew point data
  useEffect(() => {
    const generateDewPointData = () => {
      const temp = 20 + Math.sin(selectedLocation.lat * 0.1) * 15;
      const dp = temp - (Math.abs(Math.sin(selectedLocation.lon * 0.05)) * 20);
      const humidity = ((temp - dp) / temp) * 100;
      
      let comfortLevel, comfortDesc, comfortColor;
      if (dp < 10) {
        comfortLevel = "Dry";
        comfortDesc = "Very comfortable, low moisture";
        comfortColor = "#4ade80";
      } else if (dp < 15) {
        comfortLevel = "Comfortable";
        comfortDesc = "Pleasant conditions";
        comfortColor = "#22d3ee";
      } else if (dp < 18) {
        comfortLevel = "Moderate";
        comfortDesc = "Slightly humid";
        comfortColor = "#fbbf24";
      } else if (dp < 21) {
        comfortLevel = "Humid";
        comfortDesc = "Noticeably humid";
        comfortColor = "#fb923c";
      } else {
        comfortLevel = "Oppressive";
        comfortDesc = "Very uncomfortable, heavy moisture";
        comfortColor = "#ef4444";
      }

      setDewPoint({
        value: dp.toFixed(1),
        temperature: temp.toFixed(1),
        humidity: humidity.toFixed(0)
      });
      
      setComfort({ level: comfortLevel, desc: comfortDesc, color: comfortColor });
    };

    generateDewPointData();
  }, [selectedLocation]);

  // Animated gradient visualization based on comfort level
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !comfort) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    
    let frame = 0;
    
    // Dynamic animation parameters based on dew point
    const getAnimationParams = () => {
      const dp = parseFloat(dewPoint?.value || 15);
      
      if (dp < 10) {
        // Dry - cool blues and greens, sparse particles
        return {
          particleCount: 35,
          speed: 30,
          gradientColors: [
            'rgba(74, 222, 128, 0.3)',   // green
            'rgba(34, 211, 238, 0.25)',  // cyan
            'rgba(59, 130, 246, 0.2)',   // blue
            'rgba(34, 211, 238, 0.2)',   // cyan
            'rgba(74, 222, 128, 0.3)'    // green
          ],
          particleColor: 'rgba(147, 197, 253, 0.35)',
          particleSize: 2.5
        };
      } else if (dp < 15) {
        // Comfortable - cyan/blue tones
        return {
          particleCount: 50,
          speed: 40,
          gradientColors: [
            'rgba(34, 211, 238, 0.3)',
            'rgba(59, 130, 246, 0.25)',
            'rgba(34, 211, 238, 0.2)',
            'rgba(59, 130, 246, 0.25)',
            'rgba(34, 211, 238, 0.3)'
          ],
          particleColor: 'rgba(147, 197, 253, 0.35)',
          particleSize: 3
        };
      } else if (dp < 18) {
        // Moderate - yellow/cyan mix
        return {
          particleCount: 65,
          speed: 50,
          gradientColors: [
            'rgba(251, 191, 36, 0.35)',  // yellow
            'rgba(34, 211, 238, 0.25)',  // cyan
            'rgba(251, 191, 36, 0.2)',
            'rgba(249, 115, 22, 0.2)',   // orange
            'rgba(251, 191, 36, 0.35)'
          ],
          particleColor: 'rgba(251, 191, 36, 0.4)',
          particleSize: 3.5
        };
      } else if (dp < 21) {
        // Humid - orange/red tones
        return {
          particleCount: 80,
          speed: 60,
          gradientColors: [
            'rgba(249, 115, 22, 0.35)',  // orange
            'rgba(251, 191, 36, 0.25)',  // yellow
            'rgba(249, 115, 22, 0.25)',
            'rgba(239, 68, 68, 0.25)',   // red
            'rgba(249, 115, 22, 0.35)'
          ],
          particleColor: 'rgba(249, 115, 22, 0.4)',
          particleSize: 4
        };
      } else {
        // Oppressive - red/dark red, dense
        return {
          particleCount: 100,
          speed: 70,
          gradientColors: [
            'rgba(239, 68, 68, 0.4)',    // red
            'rgba(249, 115, 22, 0.3)',   // orange
            'rgba(239, 68, 68, 0.3)',
            'rgba(220, 38, 38, 0.3)',    // dark red
            'rgba(239, 68, 68, 0.4)'
          ],
          particleColor: 'rgba(239, 68, 68, 0.45)',
          particleSize: 4.5
        };
      }
    };
    
    const animate = () => {
      frame += 0.005;
      const params = getAnimationParams();
      
      // Create flowing gradient effect
      const gradient = ctx.createLinearGradient(
        Math.sin(frame) * width,
        Math.cos(frame * 0.7) * height,
        Math.cos(frame) * width,
        Math.sin(frame * 0.7) * height
      );
      
      gradient.addColorStop(0, params.gradientColors[0]);
      gradient.addColorStop(0.3, params.gradientColors[1]);
      gradient.addColorStop(0.5, params.gradientColors[2]);
      gradient.addColorStop(0.7, params.gradientColors[3]);
      gradient.addColorStop(1, params.gradientColors[4]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw moisture particles - density based on humidity
      for (let i = 0; i < params.particleCount; i++) {
        const x = (i * 137.5 + frame * params.speed) % width;
        const y = (Math.sin(i * 0.5 + frame) * 200 + height / 2);
        const size = Math.sin(i + frame * 2) * params.particleSize + params.particleSize;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${params.particleColor.slice(0, -5)}${0.3 + Math.sin(i + frame) * 0.2})`;
        ctx.fill();
      }
      
      setAnimationFrame(requestAnimationFrame(animate));
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrame);
  }, [comfort, dewPoint]);

  const locations = [
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  ];

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Animated Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/90 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Dew Point Analysis</h1>
              <p className="text-xs text-cyan-300">Moisture & Comfort Index Visualization</p>
            </div>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-20 right-4 z-30 w-80 bg-slate-800/95 backdrop-blur-md rounded-xl p-5 border border-cyan-500/30 shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-cyan-400">About Dew Point</h3>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-300 space-y-2">
            <p>The dew point is the temperature at which air becomes saturated with moisture and dew forms.</p>
            <p className="font-semibold text-white">Comfort Levels:</p>
            <ul className="space-y-1 text-xs">
              <li><span className="text-green-400">• &lt;10°C:</span> Dry and comfortable</li>
              <li><span className="text-cyan-400">• 10-15°C:</span> Pleasant conditions</li>
              <li><span className="text-yellow-400">• 15-18°C:</span> Slightly humid</li>
              <li><span className="text-orange-400">• 18-21°C:</span> Humid and sticky</li>
              <li><span className="text-red-400">• &gt;21°C:</span> Oppressively humid</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-4 top-24 z-30 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white transition-all"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left Sidebar */}
      <div className={`absolute left-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-r border-cyan-500/30 transition-transform duration-300 z-10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 mt-20 space-y-6">
          {/* Location Selector */}
          <div>
            <label className="text-sm font-semibold text-cyan-400 mb-2 block">Select Location</label>
            <select 
              value={selectedLocation.name}
              onChange={(e) => {
                const loc = locations.find(l => l.name === e.target.value);
                setSelectedLocation(loc);
              }}
              className="w-full bg-slate-800 text-white rounded-lg p-3 border border-cyan-500/30 focus:outline-none focus:border-cyan-400"
            >
              {locations.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Current Readings */}
          {dewPoint && comfort && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-gray-400">Dew Point</span>
                </div>
                <div className="text-4xl font-bold text-white">{dewPoint.value}°C</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Temperature</span>
                </div>
                <div className="text-3xl font-bold text-white">{dewPoint.temperature}°C</div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Relative Humidity</span>
                </div>
                <div className="text-3xl font-bold text-white">{dewPoint.humidity}%</div>
              </div>

              {/* Comfort Index */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border" style={{ borderColor: comfort.color + '50' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="w-5 h-5" style={{ color: comfort.color }} />
                  <span className="text-sm text-gray-400">Comfort Level</span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: comfort.color }}>
                  {comfort.level}
                </div>
                <p className="text-sm text-gray-400">{comfort.desc}</p>
              </div>
            </div>
          )}

          {/* Weather Prediction Note */}
          <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">Weather Prediction</h4>
            <p className="text-xs text-gray-300">
              Rising dew points often indicate increasing atmospheric moisture, which can signal approaching precipitation or thunderstorms.
            </p>
          </div>
        </div>
      </div>

      {/* Central Display Area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-center">
          <div className="text-9xl font-bold text-white/15 mb-4">
            {dewPoint ? `${dewPoint.value}°C` : '--'}
          </div>
          <div className="text-3xl text-white/40 font-light">
            {selectedLocation.name}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-cyan-500/30 z-20">
        <h4 className="text-sm font-semibold text-cyan-400 mb-3">Comfort Scale</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-green-400"></div>
            <span className="text-gray-300">Dry (&lt;10°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-cyan-400"></div>
            <span className="text-gray-300">Comfortable (10-15°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-yellow-400"></div>
            <span className="text-gray-300">Moderate (15-18°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-orange-400"></div>
            <span className="text-gray-300">Humid (18-21°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-red-400"></div>
            <span className="text-gray-300">Oppressive (&gt;21°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DewPointVisualization;