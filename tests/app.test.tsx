import React from 'react'
import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import App from '../src/App';

it('The applications renders correctly', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText(/Bem-vindo de volta!/i)).toBeInTheDocument());
});
