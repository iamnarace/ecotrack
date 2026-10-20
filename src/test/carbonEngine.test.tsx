import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BASELINE_SCENARIO,
  TARGET_SCENARIO,
  REGIONAL_PRESETS,
  getCitationTableForRegion,
  calculateEffectiveElectricityFactor,
  calculateEvKgPerKm,
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

  it('scales EV transport emissions consistently with renewable electricity share and regional grid presets', () => {
    const evScenario = {
      ...BASELINE_SCENARIO,
      carPetrolKmPerWeek: 0,
      publicTransitKmPerWeek: 0,
      evKmPerWeek: 200,
    };

    const ukGridZeroRenew = calculateScenarioFootprint(
      { ...evScenario, renewableElectricityPercent: 0 },
      'uk'
    );
    const ukFullRenew = calculateScenarioFootprint(
      { ...evScenario, renewableElectricityPercent: 100 },
      'uk'
    );
    const auGridZeroRenew = calculateScenarioFootprint(
      { ...evScenario, renewableElectricityPercent: 0 },
      'au'
    );

    // 1. Increasing renewable electricity % reduces EV transport emissions proportionally
    expect(ukFullRenew.effectiveEvKgPerKm).toBeLessThan(ukGridZeroRenew.effectiveEvKgPerKm);
    expect(ukFullRenew.surfaceTransportKg).toBeLessThan(ukGridZeroRenew.surfaceTransportKg);

    // Verify exact formula: evConsumptionKwhPerKm * effectiveElectricityFactor
    const expectedUkEvZero =
      REGIONAL_PRESETS.uk.evConsumptionKwhPerKm *
      calculateEffectiveElectricityFactor('uk', 0);
    expect(calculateEvKgPerKm('uk', 0)).toBeCloseTo(expectedUkEvZero, 5);

    // 2. Higher-carbon regional grid (Australia 0.630 kg/kWh vs UK 0.207 kg/kWh) yields higher unblended EV emissions
    expect(auGridZeroRenew.effectiveEvKgPerKm).toBeGreaterThan(
      ukGridZeroRenew.effectiveEvKgPerKm
    );
    expect(auGridZeroRenew.surfaceTransportKg).toBeGreaterThan(
      ukGridZeroRenew.surfaceTransportKg
    );
  });

  it('documents explicit geographic origins for every emission factor and updates UI when switching regional presets', () => {
    for (const regionId of ['uk', 'us', 'eu', 'au'] as const) {
      const citations = getCitationTableForRegion(regionId, 25);
      expect(citations.length).toBeGreaterThanOrEqual(7);
      for (const row of citations) {
        expect(row.geographicOrigin.length).toBeGreaterThan(5);
        expect(row.sourceReference.length).toBeGreaterThan(10);
      }
      // Regional grid & transport rows carry the selected preset's exact geographic origin
      const gridRow = citations.find((r) => r.id === 'ef-elec');
      expect(gridRow?.geographicOrigin).toBe(REGIONAL_PRESETS[regionId].geographicOrigin);
    }

    render(<App />);
    const ukBaselineText = screen.getByTestId('baseline-total').textContent;

    const regionSelect = screen.getByLabelText(/Regional emission factor preset/i);
    fireEvent.change(regionSelect, { target: { value: 'au' } });

    const auBaselineText = screen.getByTestId('baseline-total').textContent;
    expect(auBaselineText).not.toBe(ukBaselineText);

    // Switch to Methodology & Citations and verify explicit Geographic Origin column & Australian NGA citation
    fireEvent.click(screen.getByRole('button', { name: /Methodology & Citations/i }));
    expect(screen.getByText(/Geographic Origin/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Australia \(National Electricity Market & National Inventory\)/i)
        .length
    ).toBeGreaterThan(0);
  });
});
