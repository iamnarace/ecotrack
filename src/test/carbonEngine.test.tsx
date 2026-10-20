import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BASELINE_SCENARIO,
  TARGET_SCENARIO,
  calculateScenarioFootprint,
  generateReductionPathways,
  buildMarkdownReport,
} from '../utils/carbonEngine';
import App from '../App';

describe('EcoTrack Carbon Footprint Simulator & Methodology Tests', () => {
  it('computes annualized per-capita and total household footprints deterministically', () => {
    const base = calculateScenarioFootprint(BASELINE_SCENARIO);
    const target = calculateScenarioFootprint(TARGET_SCENARIO);

    expect(base.perCapitaAnnualKg).toBeGreaterThan(target.perCapitaAnnualKg);
    expect(base.totalAnnualKg).toBe(base.perCapitaAnnualKg * BASELINE_SCENARIO.householdSize);
  });

  it('scales electricity emissions down proportionally when renewable tariff share increases', () => {
    const gridOnly = calculateScenarioFootprint({
      ...BASELINE_SCENARIO,
      renewableElectricityPercent: 0,
    });
    const fullRenewable = calculateScenarioFootprint({
      ...BASELINE_SCENARIO,
      renewableElectricityPercent: 100,
    });
    expect(fullRenewable.electricityKg).toBeLessThan(gridOnly.electricityKg);
  });

  it('generates ranked reduction pathways and formats a Markdown assessment report', () => {
    const recs = generateReductionPathways(BASELINE_SCENARIO);
    expect(recs.length).toBeGreaterThan(2);
    expect(recs[0].estimatedAnnualSavingKg).toBeGreaterThanOrEqual(
      recs[1].estimatedAnnualSavingKg
    );

    const baseRes = calculateScenarioFootprint(BASELINE_SCENARIO);
    const targetRes = calculateScenarioFootprint(TARGET_SCENARIO);
    const md = buildMarkdownReport(
      BASELINE_SCENARIO,
      TARGET_SCENARIO,
      baseRes,
      targetRes
    );
    expect(md).toContain('# EcoTrack Sustainability Scenario Assessment Report');
    expect(md).toContain('Educational Estimate Notice:');
  });

  it('renders EcoTrack simulator UI and switches to Methodology & Citations view', () => {
    render(<App />);
    expect(screen.getByText('EcoTrack')).toBeInTheDocument();
    expect(
      screen.getByText(/Category Impact Comparison/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Methodology & Citations/i }));
    expect(
      screen.getByText(/Calculation Methodology, Assumptions & Published Sources/i)
    ).toBeInTheDocument();
  });
});
