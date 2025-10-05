# 🌦️SOFTWARE ENGINEERING COURSE PROJECT: Web-Based Weather Detection & Analysis Platform

An advanced, AI-powered platform for real-time weather visualization, scientific analysis, and predictive forecasting.  
Built with modern web technologies, 3D visualization, and machine learning to deliver accurate insights on global weather trends.

---

## 🧭 Overview

WeatherApp combines live weather data, NOAA scientific reanalysis models, and AI-driven forecasts into a single, interactive experience.

### 🌍 Core Modules

#### 1. **Main Page — 3D Interactive Globe**
- immersive 3D globe visualization.
- Select any location by:
  - Clicking on a **pin** on the globe, or  
  - Searching via a **Mapbox-powered search bar**.
- Displays **live weather metrics** (temperature, humidity, wind speed, etc.) and **short-term forecasts**.

#### 2. **Scientific & Analysis Page**
- Renders **wind maps, heatmaps, and pressure visualizations** similar to *Earth Nullschool*.
- Uses **NOAA GFS (Global Forecast System)** datasets.
- Implemented with **GPU-based particle shaders** and **Three.js** for real-time simulation.

#### 3. **Trend Analysis & Predictions**
- Interactive **trend analysis** using decades of historical weather data.
- Visualized using **Plotly.js** with dynamic time-series graphs.
- **LSTM model (PyTorch)** predicts 1–7 day forecasts for any region.
- Model served through a **FastAPI microservice**.

---
