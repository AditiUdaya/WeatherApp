import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Sun, Thermometer, CloudRain, Activity } from "lucide-react";

// Import your actual components
import WindAnalysis from './components/Wind.jsx';
import Heatmap from './components/Maps.jsx';
import Pressure from './components/Pressure.jsx';
import UVIndex from './components/Uv.jsx';
import DewPoint from './components/DewPoint.jsx';

const AnalysisPage = ({ weatherData, lat, lon, fetchWeatherData }) => {
  const [lockedTab, setLockedTab] = useState("wind");

  const [hoveredTab, setHoveredTab] = useState(null);

  const analyses = [
    { id: "wind", label: "Wind", icon: <Wind size={22} /> },
    { id: "heatmap", label: "Heatmap", icon: <Thermometer size={22} /> },
    { id: "pressure", label: "Pressure", icon: <Activity size={22} /> },
    { id: "dewpoint", label: "Dew Point", icon: <CloudRain size={22} /> },
    { id: "uv", label: "UV Index", icon: <Sun size={22} /> },
  ];

  // Active tab is either hovered (temporary) or locked (permanent)
  const activeTab = hoveredTab || lockedTab;

  const handleClick = (tabId) => {
    setLockedTab(tabId);
  };

  const renderActive = () => {
    switch (activeTab) {
      case "wind":
        return <WindAnalysis />;
      case "heatmap":
        return <Heatmap />;
      case "pressure":
        return <Pressure />;
      case "dewpoint":
        return <DewPoint />;
      case "uv":
        return <UVIndex />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Hover over an analysis type to preview, click to lock.
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans">
      {/* Small summary panel showing the selected location's weather (passed from App) */}
      <div className="absolute top-4 right-4 z-50 bg-gray-900/80 rounded-md p-3 border border-gray-700 text-sm">
        {weatherData ? (
          <div className="flex flex-col gap-1">
            <div className="font-semibold">{weatherData.name || 'Selected Location'}</div>
            <div>{Math.round(weatherData.main.temp)}°C — {weatherData.weather[0].description}</div>
            <div className="text-gray-400 text-xs">Humidity: {weatherData.main.humidity}%</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-gray-400">No weather loaded for analysis.</div>
            {lat != null && lon != null ? (
              <button
                onClick={() => fetchWeatherData(lat, lon)}
                className="mt-1 px-3 py-1 bg-blue-600 rounded text-white text-xs"
              >
                Load weather for {lat.toFixed(2)}, {lon.toFixed(2)}
              </button>
            ) : (
              <div className="text-gray-500 text-xs">Click a location on the globe first.</div>
            )}
          </div>
        )}
      </div>
      {/* Left Floating Sidebar */}
      <div className="absolute left-0 top-0 h-full w-28 flex flex-col justify-center items-center bg-transparent z-50 space-y-5 backdrop-blur-sm">
        {analyses.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = lockedTab === tab.id;

          return (
            <motion.div
              key={tab.id}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              onClick={() => handleClick(tab.id)}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`relative flex flex-col items-center justify-center cursor-pointer 
                transition-all duration-200 
                ${isLocked ? "text-blue-500" : isActive ? "text-blue-400" : "text-gray-400 hover:text-white"}`}
            >
              {/* Lock indicator */}
              {isLocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                />
              )}

              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`${isActive ? "mb-1" : ""}`}
              >
                {tab.icon}
              </motion.div>

              {/* Label */}
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span
                    key={tab.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="absolute left-28 top-0 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {renderActive()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalysisPage;