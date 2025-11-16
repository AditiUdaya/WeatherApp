// Stability tests to ensure the application boots without errors
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock components that might cause issues in tests
jest.mock('worldwind-react-globe', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-globe">Mock Globe</div>
}));

describe('Application Stability', () => {
  // Mock console.error to catch React error boundaries
  const originalError = console.error;
  
  beforeAll(() => {
    // Suppress expected error boundary warnings in tests
    console.error = (...args) => {
      if (/Warning: React does not recognize the.*prop on a DOM element/.test(args[0])) {
        return;
      }
      originalError.call(console, ...args);
    };
    
    // Mock window.scrollTo which is called in some React components
    window.scrollTo = jest.fn();
  });

  afterAll(() => {
    // Restore original console.error
    console.error = originalError;
  });

  it('bootstraps without runtime errors', () => {
    // This test will fail if the app throws during rendering
    expect(() => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('renders the main application container', () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    expect(container).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    // This test ensures the app doesn't crash when required data is missing
    const { container } = render(
      <MemoryRouter>
        <App weatherData={null} />
      </MemoryRouter>
    );
    
    expect(container).toBeInTheDocument();
  });
});
