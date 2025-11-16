import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalysisPage from '../pages/analysis/AnalysisPage';

// Mock child components
jest.mock('../pages/analysis/components/Wind', () => ({
  __esModule: true,
  default: () => <div data-testid="wind-component">Wind Component</div>
}));

jest.mock('../pages/analysis/components/Pressure', () => ({
  __esModule: true,
  default: () => <div data-testid="pressure-component">Pressure Component</div>
}));

jest.mock('../pages/analysis/components/Uv', () => ({
  __esModule: true,
  default: () => <div data-testid="uv-component">UV Component</div>
}));

// Mock the local storage
describe('AnalysisPage', () => {
  const mockWeatherData = {
    main: { 
      temp: 20,
      humidity: 60,
      pressure: 1013
    },
    weather: [{ 
      main: 'Clear',
      description: 'clear sky',
      icon: '01d'
    }],
    wind: {
      speed: 3.6,
      deg: 90
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({ lat: 40.7128, lon: -74.0060 }));
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <AnalysisPage 
          weatherData={mockWeatherData}
          lat={40.7128}
          lon={-74.0060}
        />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Weather Analysis')).toBeInTheDocument();
  });

  it('renders all analysis components', () => {
    render(
      <MemoryRouter>
        <AnalysisPage 
          weatherData={mockWeatherData}
          lat={40.7128}
          lon={-74.0060}
        />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('wind-component')).toBeInTheDocument();
    expect(screen.getByTestId('pressure-component')).toBeInTheDocument();
    expect(screen.getByTestId('uv-component')).toBeInTheDocument();
  });

  it('displays the current weather data', () => {
    render(
      <MemoryRouter>
        <AnalysisPage 
          weatherData={mockWeatherData}
          lat={40.7128}
          lon={-74.0060}
        />
      </MemoryRouter>
    );
    
    expect(screen.getByText('20°C')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('clear sky')).toBeInTheDocument();
  });
});
