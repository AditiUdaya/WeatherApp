// Simple mock for worldwind-react-globe
import React from 'react';

const Globe = React.forwardRef(({ layers }, ref) => {
  if (ref) {
    ref.current = { wwd: { goTo: jest.fn(), addLayer: jest.fn() } };
  }
  return <div data-testid="mock-globe">MockGlobe</div>;
});

Globe.displayName = 'Globe';
export default Globe;
