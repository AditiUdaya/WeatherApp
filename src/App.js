import React, { Component, useEffect, useState } from "react";
import Globe from "worldwind-react-globe";
import WorldWind from "@nasaworldwind/worldwind";
import { Link, withRouter, useNavigate } from "react-router-dom";

import "./App.css";
import WeatherDisplay from "./WeatherDisplay";
import AnalysisPage from "./pages/analysis/AnalysisPage";
import SearchBar from "./components/SearchBar";
import "./components/SearchBar.css";


const API_KEY = "c47e0385fe37b28b0332290341191045";

/**
 * Inline Compass component (round mini compass).
 * Props:
 *  - wwd: WorldWindow instance
 */
function Compass({ wwd }) {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (!wwd) return;
    let rafId = null;

    function update() {
      try {
        // heading is in degrees
        const h = (wwd.navigator.heading || 0) * (180 / Math.PI);
        setHeading((-h) % 360); // invert for correct visual rotation
      } catch (e) {
        // ignore
      }
      rafId = requestAnimationFrame(update);
    }

    rafId = requestAnimationFrame(update);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [wwd]);

  return (
    <div className="custom-tools">
      <div className="compass" title="Compass (heading)">
        <div
          className="compass-needle"
          style={{ transform: `rotate(${heading}deg)` }}
        />
        <div className="compass-n">N</div>
      </div>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lat: null,
      lon: null,
      weatherData: null,
      isLoading: false,
      wwd: null, // WorldWindow instance
      boundaryOn: false, // whether boundaries overlay is on
      boundaryLayer: null,
    };

    this.globeRef = React.createRef();
    this.markerLayer = null;
  }

  componentDidMount() {
    const globe = this.globeRef.current;
    if (!globe) return;

    const wwd = globe.wwd;
    this.setState({ wwd });

    // Safe init
    try {
      wwd.drawContext.clearColor = new WorldWind.Color(0, 0, 0, 1);

      wwd.navigator.lookAtLocation.latitude = 20;
      wwd.navigator.lookAtLocation.longitude = 78;
      wwd.navigator.range = 25000000;

      this.markerLayer = new WorldWind.RenderableLayer("Click Marker");
      wwd.addLayer(this.markerLayer);

      wwd.canvas.addEventListener("click", this.handleGlobeClick);

      wwd.redraw();
    } catch (e) {
      console.error("WorldWind init error", e);
    }
  }

  handleGlobeClick = (event) => {
    const wwd = this.state.wwd;
    if (!wwd) return;

    const canvasCoords = wwd.canvasCoordinates(event.clientX, event.clientY);
    const pickList = wwd.pick(canvasCoords);

    if (!pickList || !pickList.objects) return;

    const terrainObj = pickList.objects.find(
      (o) => o.isTerrain || (o.position && o.position.latitude)
    );

    if (!terrainObj || !terrainObj.position) return;

    const lat = terrainObj.position.latitude;
    const lon = terrainObj.position.longitude;

    this.updateMarker(lat, lon);
    this.fetchWeatherData(lat, lon);
  };

  updateMarker(lat, lon, customLabel = null) {
    const wwd = this.state.wwd;
    if (!wwd || !this.markerLayer) return;

    this.markerLayer.renderables = [];

    const attrs = new WorldWind.PlacemarkAttributes(null);
    attrs.imageScale = 0.75;

    const marker = new WorldWind.Placemark(
      new WorldWind.Position(lat, lon, 1000),
      true,
      attrs
    );

    marker.label = customLabel || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    this.markerLayer.addRenderable(marker);
    wwd.redraw();
    
    // Save coordinates to localStorage for the analysis page
    localStorage.setItem("coords", JSON.stringify({ lat, lon }));
  }

  async fetchWeatherData(lat, lon) {
    this.setState({ isLoading: true });

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();

      this.setState({
        lat,
        lon,
        weatherData: data,
        isLoading: false,
      });
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false });
    }
  }

  toggleBoundaries = async () => {
    const { wwd, boundaryOn, boundaryLayer } = this.state;
    if (!wwd) return;

    // If currently ON -> remove
    if (boundaryOn) {
      if (boundaryLayer) {
        try {
          wwd.removeLayer(boundaryLayer);
        } catch (e) {
          console.warn("Failed to remove boundary layer", e);
        }
      }
      this.setState({ boundaryOn: false, boundaryLayer: null }, () =>
        wwd.redraw()
      );
      return;
    }

    // Otherwise create + add a WMS tile layer for OSM (contains country/road boundaries)
    // NOTE: If this WMS is unavailable, swap the ServiceAddress to another WMS provider.
    try {
      // terrestris OSM WMS - public tile WMS
      const serviceAddress = "https://ows.terrestris.de/osm/service";
      const layerNames = "OSM-WMS";

      // WmsLayer constructor: new WorldWind.WmsLayer(serviceAddress, layerNames, params)
      // Some WorldWind builds accept options object; be tolerant
      const wmsLayer = new WorldWind.WmsLayer(serviceAddress, layerNames, {
        format: "image/png",
        transparent: true,
      });

      wwd.addLayer(wmsLayer);
      this.setState({ boundaryOn: true, boundaryLayer: wmsLayer }, () =>
        wwd.redraw()
      );
    } catch (err) {
      console.error("Failed to add boundary WMS layer", err);
      // fallback: set boundaryOn false and keep user informed
      this.setState({ boundaryOn: false, boundaryLayer: null });
      alert(
        "Could not load boundary tiles from the WMS server. Try another WMS or check network."
      );
    }
  };

  async geoLookup(placeName) {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY || 'c47e0385fe37b28b0332290341191045';
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(placeName)}&limit=1&appid=${apiKey}`
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        throw new Error('Location not found');
      }
      return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  goToLocation = async (lat, lon, displayName = null) => {
    const wwd = this.state.wwd;
    if (!wwd) return;

    // Animate to the location
    wwd.goTo(new WorldWind.Location(lat, lon));
    
    // Update marker with location name if available
    this.updateMarker(lat, lon, displayName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    
    // Fetch weather data for the new location
    this.fetchWeatherData(lat, lon);
  };

  handleSearch = async (query) => {
    try {
      const { lat, lon, name } = await this.geoLookup(query);
      this.goToLocation(lat, lon, name);
      return { success: true };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };

  renderGlobe() {
    const layers = [
      { layer: "blue-marble", options: { enabled: true, category: "base" } },
      { layer: "coordinates", options: { enabled: true, category: "setting" } },
      { layer: "view-controls", options: { enabled: true, category: "setting" } },
    ];

    return (
      <div className="globe-permanent">
        <Globe ref={this.globeRef} layers={layers} />
        
        <SearchBar onSearch={this.handleSearch} className="search-bar-container" />

        <WeatherDisplay
          weatherData={this.state.weatherData}
          isLoading={this.state.isLoading}
        />
      </div>
    );
  }

  renderTools() {
    const { wwd, boundaryOn } = this.state;
    return (
      // Tools container bottom-left
      <div className="tools-float">
        {/* Compass */}
        <div className="tools-column">
          <Compass wwd={wwd} />
        </div>

        {/* Boundary toggle */}
        <div className="tools-column">
          <button
            className={`tool-btn ${boundaryOn ? "on" : ""}`}
            title="Toggle country/OSM boundaries"
            onClick={this.toggleBoundaries}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c-2.5 0-4.5-2-4.5-4.5S18.5 1 21 1" />
              <path d="M3 14c2.5 0 4.5 2 4.5 4.5S5.5 23 3 23" />
              <path d="M6 12l6-9 6 9" />
            </svg>
            <span className="tool-label">Boundaries</span>
          </button>
        </div>
      </div>
    );
  }

  render() {
    const pathname = this.props.location.pathname;

    return (
      <div className="app-container">
        <nav className="custom-navbar">
          <Link className={`nav-link ${pathname === "/" ? "active" : ""}`} to="/">
            🌍Globe
          </Link>

          <Link
            className={`nav-link ${pathname === "/analysis" ? "active" : ""}`}
            to="/analysis"
          >
             Weather Analysis
          </Link>
        </nav>

        {/* Globe always mounted */}
        {this.renderGlobe()}

        {/* Tools floating on top */}
        {this.renderTools()}

        {/* Analysis Overlay - Only shown when /analysis route is active */}
        {pathname === "/analysis" && (
          <div className="analysis-overlay">
            <div className="analysis-content">
              <AnalysisPage
                weatherData={this.state.weatherData}
                lat={this.state.lat}
                lon={this.state.lon}
                fetchWeatherData={this.fetchWeatherData}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(App);
