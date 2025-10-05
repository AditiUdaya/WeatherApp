import React, { Component } from 'react'
import Globe from 'worldwind-react-globe'
import {
  CardColumns,
  Container
} from 'reactstrap'
import {
  LayersCard,
  NavBar,
  Tools
} from 'worldwind-react-globe-bs4'
import WorldWind from '@nasaworldwind/worldwind';

import './App.css'
import WeatherDisplay from './WeatherDisplay';

// IMPORTANT: Replace with your actual API key from OpenWeatherMap
const API_KEY = 'xxxxxx';

export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      lat: 34.2,
      lon: -119.2,
      alt: 10e6,
      globe: null,
      weatherData: null,
      isLoading: false,
    }

    this.globeRef = React.createRef()
    this.layersRef = React.createRef()
  }

  componentDidMount() {
    const globe = this.globeRef.current;
    if (globe) {
      // setting the background color
      globe.wwd.drawContext.clearColor = new WorldWind.Color(0, 0, 0, 1);

      // setting initial view
      globe.wwd.navigator.lookAtLocation.latitude = 55.63;
      globe.wwd.navigator.lookAtLocation.longitude = -116.47;
      globe.wwd.navigator.range = 17729000;

      // *** THIS IS THE FIX ***
      // We add a standard 'click' event listener to the globe's canvas
      // This is more reliable than addGestureRecognizer
      globe.wwd.canvas.addEventListener('click', this.handleGlobeClick);

      globe.wwd.redraw();
    }
    this.setState({ globe });
  }

  // The click handler now receives a standard MouseEvent
  handleGlobeClick = (event) => {
    const wwd = this.globeRef.current.wwd;
    // Get the coordinates from the mouse event
    const x = event.clientX;
    const y = event.clientY;

    const pickList = wwd.pick(wwd.canvasCoordinates(x, y));
    const terrainObject = pickList.objects.find(obj => obj.isTerrain);

    if (terrainObject) {
      const lat = terrainObject.position.latitude;
      const lon = terrainObject.position.longitude;
      this.fetchWeatherData(lat, lon);
    }
  };

  fetchWeatherData = async (lat, lon) => {
    this.setState({ isLoading: true, weatherData: null });
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Weather data not found');
      const data = await response.json();
      this.setState({ weatherData: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      this.setState({ isLoading: false });
    }
  };

  render() {
    const globe = this.globeRef.current

    const layers = [
      { layer: 'blue-marble', options: { category: 'base', enabled: true } },
      { layer: 'blue-marble-landsat', options: { category: 'base', enabled: false } },
      { layer: 'bing-aerial', options: { category: 'base', enabled: false } },
      { layer: 'bing-aerial-labels', options: { category: 'base', enabled: false } },
      // The layer below was also causing errors, so we'll disable it by default for now
      { layer: 'eox-sentinal2-labels', options: { category: 'base', enabled: true } },
      { layer: 'eox-openstreetmap', options: { category: 'overlay', enabled: false, opacity: 0.8 } },
      { layer: 'coordinates', options: { category: 'setting', enabled: true } },
      { layer: 'view-controls', options: { category: 'setting', enabled: true } },
    ]

    const navbarItems = []

    return (
      <div>
        <NavBar
          logo=''
          title='Weather App'
          items={navbarItems}
        />
        <Container fluid className='p-0'>
          <div className='globe'>
            <Globe
              ref={this.globeRef}
              layers={layers} />
          </div>
          <WeatherDisplay
            weatherData={this.state.weatherData}
            isLoading={this.state.isLoading}
          />
          <div className='overlayTools noninteractive'>
            <Tools
              globe={globe}
              markers={null}
              markersLayerName={null}
            />
          </div>
          <div className='overlayCards noninteractive'>
            <CardColumns>
              <LayersCard
                ref={this.layersRef}
                categories={['overlay', 'base']}
                globe={globe} />
            </CardColumns>
          </div>
        </Container>
      </div>
    )
  }

}
