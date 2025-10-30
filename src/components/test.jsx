import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Sun, Thermometer, CloudRain, Activity } from "lucide-react";

// Import your actual components
import WindAnalysis from './Wind.jsx';
import Heatmap from './Maps.jsx';
import Pressure from './Pressure.jsx';
import UVIndex from './Uv.jsx';
import DewPoint from './DewPoint.jsx';

const AnalysisPage = () => {
  const [lockedTab, setLockedTab] = useState(null);
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
                    className="text-sm tracking-wide font-semibold"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Visualization Area */}
      <div className="w-full h-full pl-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab || "default"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
