import React, { useState, useEffect, useRef } from 'react';
import { Info, Maximize2, Minimize2, Download } from 'lucide-react';

const Pressure = () => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredPressure, setHoveredPressure] = useState(null);
  const [pressureData, setPressureData] = useState(null);
  const [extrema, setExtrema] = useState({ highs: [], lows: [] });
  const [showInfo, setShowInfo] = useState(false);

  // Simulate NOAA GFS pressure data (replace with actual API call)
  const generatePressureData = () => {
    const width = 360;
    const height = 180;
    const data = new Array(height).fill(0).map(() => new Array(width).fill(0));
    
    // Generate realistic pressure field with multiple systems
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lat = 90 - (y / height) * 180;
        const lon = (x / width) * 360 - 180;
        
        // Base pressure with latitude variation
        let pressure = 1013 - Math.abs(lat) * 0.15;
        
        // Add high pressure systems
        pressure += 25 * Math.exp(-((x - 90) ** 2 + (y - 45) ** 2) / 400);
        pressure += 20 * Math.exp(-((x - 270) ** 2 + (y - 60) ** 2) / 500);
        
        // Add low pressure systems
        pressure -= 30 * Math.exp(-((x - 180) ** 2 + (y - 90) ** 2) / 450);
        pressure -= 25 * Math.exp(-((x - 45) ** 2 + (y - 120) ** 2) / 350);
        
        // Add some noise for realism
        pressure += (Math.random() - 0.5) * 3;
        
        data[y][x] = pressure;
      }
    }
    
    return data;
  };

  // Find local extrema (highs and lows)
  const findExtrema = (data) => {
    const highs = [];
    const lows = [];
    const threshold = 8; // Minimum pressure difference
    
    for (let y = 10; y < data.length - 10; y += 15) {
      for (let x = 10; x < data[0].length - 10; x += 15) {
        const center = data[y][x];
        let isHigh = true;
        let isLow = true;
        
        // Check surrounding points
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = data[y + dy][x + dx];
            if (neighbor > center) isHigh = false;
            if (neighbor < center) isLow = false;
          }
        }
        
        if (isHigh && center > 1020) {
          highs.push({ x, y, value: center });
        } else if (isLow && center < 1005) {
          lows.push({ x, y, value: center });
        }
      }
    }
    
    return { highs, lows };
  };

  // Bilinear interpolation for smooth pressure values
  const interpolatePressure = (data, x, y) => {
    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, data[0].length - 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, data.length - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    const p00 = data[y0][x0];
    const p10 = data[y0][x1];
    const p01 = data[y1][x0];
    const p11 = data[y1][x1];
    
    return p00 * (1 - fx) * (1 - fy) +
           p10 * fx * (1 - fy) +
           p01 * (1 - fx) * fy +
           p11 * fx * fy;
  };

  // Draw pressure gradient background
  const drawPressureGradient = (ctx, data, width, height) => {
    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dataX = (x / width) * data[0].length;
        const dataY = (y / height) * data.length;
        const pressure = interpolatePressure(data, dataX, dataY);
        
        // Color mapping: blue (low) to red (high)
        const normalized = (pressure - 980) / (1040 - 980);
        const clamped = Math.max(0, Math.min(1, normalized));
        
        const idx = (y * width + x) * 4;
        
        if (clamped < 0.5) {
          // Blue to cyan to white
          const t = clamped * 2;
          pixels[idx] = Math.floor(180 + t * 75);
          pixels[idx + 1] = Math.floor(200 + t * 55);
          pixels[idx + 2] = Math.floor(255);
        } else {
          // White to yellow to red
          const t = (clamped - 0.5) * 2;
          pixels[idx] = 255;
          pixels[idx + 1] = Math.floor(255 - t * 100);
          pixels[idx + 2] = Math.floor(255 - t * 255);
        }
        pixels[idx + 3] = 180; // Alpha
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Draw isobar contour lines
  const drawIsobars = (ctx, data, width, height) => {
    const isobarLevels = [];
    for (let p = 980; p <= 1040; p += 4) {
      isobarLevels.push(p);
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    
    isobarLevels.forEach(level => {
      const isHighlighted = level % 8 === 0;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.globalAlpha = isHighlighted ? 0.8 : 0.4;
      
      // March squares algorithm for contour detection
      for (let y = 0; y < data.length - 1; y++) {
        for (let x = 0; x < data[0].length - 1; x++) {
          const p00 = data[y][x];
          const p10 = data[y][x + 1];
          const p01 = data[y + 1][x];
          const p11 = data[y + 1][x + 1];
          
          // Check if contour passes through this cell
          const above = [p00 > level, p10 > level, p11 > level, p01 > level];
          const count = above.filter(Boolean).length;
          
          if (count > 0 && count < 4) {
            const points = [];
            
            // Top edge
            if ((p00 > level) !== (p10 > level)) {
              const t = (level - p00) / (p10 - p00);
              points.push([(x + t) / data[0].length * width, y / data.length * height]);
            }
            // Right edge
            if ((p10 > level) !== (p11 > level)) {
              const t = (level - p10) / (p11 - p10);
              points.push([(x + 1) / data[0].length * width, (y + t) / data.length * height]);
            }
            // Bottom edge
            if ((p11 > level) !== (p01 > level)) {
              const t = (level - p01) / (p11 - p01);
              points.push([(x + t) / data[0].length * width, (y + 1) / data.length * height]);
            }
            // Left edge
            if ((p01 > level) !== (p00 > level)) {
              const t = (level - p00) / (p01 - p00);
              points.push([x / data[0].length * width, (y + t) / data.length * height]);
            }
            
            if (points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(points[0][0], points[0][1]);
              ctx.lineTo(points[1][0], points[1][1]);
              ctx.stroke();
            }
          }
        }
      }
      
      // Draw labels for major isobars
      if (isHighlighted) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Arial';
        ctx.globalAlpha = 0.7;
        for (let x = 50; x < data[0].length; x += 80) {
          for (let y = 20; y < data.length; y += 60) {
            if (Math.abs(data[y][x] - level) < 2) {
              ctx.fillText(level, x / data[0].length * width, y / data.length * height);
            }
          }
        }
      }
    });
    
    ctx.globalAlpha = 1;
  };

  // Draw high/low pressure markers
  const drawExtremaMarkers = (ctx, extrema, width, height, dataWidth, dataHeight) => {
    // Draw highs
    extrema.highs.forEach(high => {
      const x = (high.x / dataWidth) * width;
      const y = (high.y / dataHeight) * height;
      
      ctx.fillStyle = '#ff4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('H', x, y + 5);
      
      ctx.font = '11px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(Math.round(high.value) + ' hPa', x, y + 22);
    });
    
    // Draw lows
    extrema.lows.forEach(low => {
      const x = (low.x / dataWidth) * width;
      const y = (low.y / dataHeight) * height;
      
      ctx.fillStyle = '#4444ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('L', x, y + 5);
      
      ctx.font = '11px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(Math.round(low.value) + ' hPa', x, y + 22);
    });
  };

  // Initialize and render
  useEffect(() => {
    const data = generatePressureData();
    setPressureData(data);
    
    const ext = findExtrema(data);
    setExtrema(ext);
  }, []);

  useEffect(() => {
    if (!pressureData) return;
    
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw layers
    drawPressureGradient(ctx, pressureData, width, height);
    drawIsobars(ctx, pressureData, width, height);
    drawExtremaMarkers(ctx, extrema, width, height, pressureData[0].length, pressureData.length);
    
    // Draw hover indicator on overlay
    overlayCtx.clearRect(0, 0, width, height);
    if (mousePos && hoveredPressure) {
      overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      overlayCtx.strokeStyle = '#ffffff';
      overlayCtx.lineWidth = 2;
      overlayCtx.font = '13px Arial';
      
      const text = `${hoveredPressure.toFixed(1)} hPa`;
      const metrics = overlayCtx.measureText(text);
      const padding = 8;
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = 24;
      
      let x = mousePos.x + 15;
      let y = mousePos.y - 15;
      
      if (x + boxWidth > width) x = mousePos.x - boxWidth - 15;
      if (y < 0) y = mousePos.y + 25;
      
      overlayCtx.fillRect(x, y - boxHeight, boxWidth, boxHeight);
      overlayCtx.strokeRect(x, y - boxHeight, boxWidth, boxHeight);
      
      overlayCtx.fillStyle = '#ffffff';
      overlayCtx.fillText(text, x + padding, y - 6);
    }
  }, [pressureData, extrema, mousePos, hoveredPressure]);

  const handleMouseMove = (e) => {
    if (!pressureData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    const dataX = (x / canvas.width) * pressureData[0].length;
    const dataY = (y / canvas.height) * pressureData.length;
    
    const pressure = interpolatePressure(pressureData, dataX, dataY);
    setHoveredPressure(pressure);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredPressure(null);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'pressure_contour_map.png';
    link.href = url;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Atmospheric Pressure Analysis</h1>
                <p className="text-blue-100">NOAA GFS Model - Surface Pressure Visualization</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Info size={20} />
                </button>
                <button
                  onClick={downloadImage}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="bg-blue-950/50 p-4 text-white border-b border-white/10">
              <h3 className="font-semibold mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">H</div>
                    <span>High Pressure System (&gt;1020 hPa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">L</div>
                    <span>Low Pressure System (&lt;1005 hPa)</span>
                  </div>
                </div>
                <div>
                  <p className="mb-1">• White lines: Isobars (4 hPa intervals)</p>
                  <p className="mb-1">• Thick lines: Major isobars (8 hPa intervals)</p>
                  <p>• Background: Pressure gradient magnitude</p>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Container */}
          <div className="relative bg-slate-900">
            <div className="relative" style={{ height: isFullscreen ? '80vh' : '600px' }}>
              <canvas
                ref={canvasRef}
                width={1200}
                height={600}
                className="absolute inset-0 w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              <canvas
                ref={overlayCanvasRef}
                width={1200}
                height={600}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
          </div>

          {/* Stats Footer */}
          <div className="bg-slate-800/50 p-4 grid grid-cols-3 gap-4 text-white text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{extrema.highs.length}</div>
              <div className="text-gray-300">High Pressure Systems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{extrema.lows.length}</div>
              <div className="text-gray-300">Low Pressure Systems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {hoveredPressure ? hoveredPressure.toFixed(1) : '---'}
              </div>
              <div className="text-gray-300">Current Reading (hPa)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pressure;