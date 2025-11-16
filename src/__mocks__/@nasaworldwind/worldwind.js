// Simple mock for @nasaworldwind/worldwind
export default {
  WorldWindow: jest.fn().mockImplementation(() => ({
    goTo: jest.fn(),
    addLayer: jest.fn(),
    redraw: jest.fn(),
  })),
  Location: jest.fn((lat, lon) => ({ latitude: lat, longitude: lon })),
  Position: jest.fn((lat, lon, alt) => ({ latitude: lat, longitude: lon, altitude: alt })),
  Placemark: jest.fn(() => ({})),
  PlacemarkAttributes: jest.fn(() => ({})),
  RenderableLayer: jest.fn(() => ({
    displayName: 'MockLayer',
    addRenderable: jest.fn(),
  })),
  WmsLayer: jest.fn(() => ({})),
};
