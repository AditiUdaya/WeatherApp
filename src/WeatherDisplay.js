// WeatherDisplay.js
import React from "react";
import "./WeatherDisplay.css";

function WeatherDisplay({ weatherData, isLoading }) {
  if (isLoading) {
    return (
      <div className="weather-container">
        <div className="weather-card loading">Loading...</div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="weather-container">
      <div className="weather-card">
        <div className="weather-location">{weatherData.name}</div>

        <div className="weather-icon">
          {/* You can replace with real icons later */}
          <div className="weather-emoji">🌤️</div>
        </div>

        <div className="weather-temp">
          {Math.round(weatherData.main.temp)}°C
        </div>

        <div className="weather-description">
          {weatherData.weather[0].description}
        </div>

        <div className="weather-details">
          <span>💧 {weatherData.main.humidity}%</span>
          <span>🌬 {weatherData.wind.speed} m/s</span>
        </div>
      </div>
    </div>
  );
}

export default WeatherDisplay;
