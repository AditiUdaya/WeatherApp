// This file is automatically executed before tests run
import '@testing-library/jest-dom';

// Mock fetch globally
const mockResponse = (status, statusText, response) => {
  return new window.Response(JSON.stringify(response), {
    status: status,
    statusText: statusText,
    headers: {
      'Content-type': 'application/json'
    }
  });
};

global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve(mockResponse(200, null, {}))
);
