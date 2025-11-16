import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock components that might cause issues in tests
jest.mock('worldwind-react-globe', () => 'mock-globe');
jest.mock('../components/WeatherDisplay', () => 'mock-weather-display');

describe('App', () => {
  beforeEach(() => {
    // Mock window.scrollTo which is called in some React components
    window.scrollTo = jest.fn();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Check if the app renders by looking for navigation elements
    expect(screen.getByText('🌍Globe')).toBeInTheDocument();
    expect(screen.getByText('Weather Analysis')).toBeInTheDocument();
  });

  it('renders the globe component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('mock-globe')).toBeInTheDocument();
  });
});
