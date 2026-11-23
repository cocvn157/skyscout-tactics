import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('SkyScout Tactics interactive UI workflows', () => {
  it('renders header, KPI strip, and Ascent 2D SVG map on initial load', () => {
    render(<App />);
    expect(screen.getByText('SkyScout Tactics')).toBeInTheDocument();
    expect(screen.getByText(/13 – 9/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Ascent tactical replay for round 1/i }),
    ).toBeInTheDocument();
  });

  it('switches active match series between Ascent, Haven, and Bind', () => {
    render(<App />);
    const selector = screen.getByLabelText('Active Series:');
    fireEvent.change(selector, { target: { value: 'c9-vs-sen-haven-2026' } });

    expect(screen.getByText(/13 – 11/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Haven tactical replay for round 1/i }),
    ).toBeInTheDocument();
  });

  it('selects round chips and updates map replay & scrubber state', () => {
    render(<App />);
    const round6Btn = screen.getByRole('button', { name: 'Select round 6' });
    fireEvent.click(round6Btn);

    expect(
      screen.getByRole('img', { name: /Ascent tactical replay for round 6/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Round 6 Telemetry Detail/)).toBeInTheDocument();
  });

  it('toggles map visualization layers cleanly', () => {
    render(<App />);
    const utilityBtn = screen.getByRole('button', { name: 'Utility' });
    const labelsBtn = screen.getByRole('button', { name: 'Labels' });
    fireEvent.click(utilityBtn);
    fireEvent.click(labelsBtn);
    expect(utilityBtn).not.toHaveClass('active');
    expect(labelsBtn).not.toHaveClass('active');
  });

  it('displays Opponent Tendencies and jumps directly to cited round on 2D Replay', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Tendencies & Anti-Strat/i }));

    expect(screen.getByText(/Detected NRG Esports Tendencies/i)).toBeInTheDocument();
    expect(screen.getByText(/Ranked Anti-Strat Round Calls/i)).toBeInTheDocument();

    const citeButtons = screen.getAllByRole('button', { name: /^R\d+$/ });
    expect(citeButtons.length).toBeGreaterThan(0);
    const targetRoundLabel = citeButtons[0]!.textContent!.replace('R', '');
    fireEvent.click(citeButtons[0]!);

    expect(
      screen.getByRole('img', {
        name: new RegExp(`Ascent tactical replay for round ${targetRoundLabel}`, 'i'),
      }),
    ).toBeInTheDocument();
  });

  it('interacts with Economy Simulator controls and updates loss bonus cascade', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Economy Simulator/i }));

    expect(screen.getByText(/2-Round Expected Win Value/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3+ Losses' }));
    expect(screen.getByText(/Next Loss Bonus: \$2,900/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Force Buy/i }));
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('imports Sample CSV telemetry and verifies Coach Brief SHA-256 integrity', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /GRID Importer & Export/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Load Sample CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Validate & Load Match' }));

    expect(screen.getByText(/Imported Cloud9 vs G2 Esports/i)).toBeInTheDocument();
    expect(screen.getByText(/8 rounds on HAVEN/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Verify SHA-256' }));
    expect(screen.getByText(/VERIFIED SHA-256 MATCH/i)).toBeInTheDocument();
  });
});
