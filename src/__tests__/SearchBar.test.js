import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search for a location...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('updates input value when typed into', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent.change(input, { target: { value: 'London' } });
    expect(input.value).toBe('London');
  });

  it('calls onSearch with the input value when form is submitted', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search for a location...');
    const button = screen.getByRole('button', { name: /search/i });
    
    // Type into the input
    fireEvent.change(input, { target: { value: 'London' } });
    
    // Submit the form
    await waitFor(() => {
      fireEvent.click(button);
    });
    
    // Check if onSearch was called with the correct value
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('London');
  });

  it('does not call onSearch when input is empty', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const button = screen.getByRole('button', { name: /search/i });
    
    // Submit the form without entering any text
    await waitFor(() => {
      fireEvent.click(button);
    });
    
    // onSearch should not be called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('disables button when input is empty', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeDisabled();
    
    // Type something in the input
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent.change(input, { target: { value: 'London' } });
    
    // Button should now be enabled
    expect(button).not.toBeDisabled();
  });
});
