import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('app routes content', () => {
  it('renders CMRO2 page content', async () => {
    renderAt('/cmro2-imagerie-cerebrale');
    expect(await screen.findByText(/CMRO2 en imagerie cerebrale/i)).toBeInTheDocument();
    expect(screen.getByText(/Réponse courte/i)).toBeInTheDocument();
  });

  it('renders OEF page content', async () => {
    renderAt('/oef-imagerie-cerebrale');
    expect(await screen.findByText(/OEF en imagerie cerebrale/i)).toBeInTheDocument();
  });

  it('renders CoreLab page content', async () => {
    renderAt('/corelab-essais-cliniques');
    expect(await screen.findByText(/Core Lab IRM/i)).toBeInTheDocument();
  });
});
