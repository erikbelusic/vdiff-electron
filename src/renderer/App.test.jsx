import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText('vdiff')).toBeInTheDocument();
});
