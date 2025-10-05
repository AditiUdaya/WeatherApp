import React from 'react';
import './WeatherDisplay.css'; // This line requires the CSS file to exist

const WeatherDisplay = ({ weatherData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="weather-container">
        <div className="weather-card">
          <h2>Loading weather...</h2>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="weather-container">
        <div className="weather-card">
          <h2>Click on the globe</h2>
          <p>Select any location to view its current weather.</p>
        </div>
      </div>
    );
  }

  const { name, main, weather, wind } = weatherData;
  const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

  return (
    <div className="weather-container">
      <div className="weather-card">
        <h2>{name}</h2>
        <div className="weather-main">
          <img src={iconUrl} alt={weather[0].description} className="weather-icon" />
          <p className="weather-temp">{Math.round(main.temp)}°C</p>
        </div>
        <p className="weather-description">{weather[0].description}</p>
        <div className="weather-details">
          <p>Humidity: {main.humidity}%</p>
          <p>Wind: {wind.speed} m/s</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;