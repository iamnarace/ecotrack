export type DietaryPattern = 'omnivore-high' | 'omnivore-moderate' | 'vegetarian' | 'vegan';

export interface ActivityScenarioInput {
  name: string;
  householdSize: number;
  // Transport (weekly km)
  carPetrolKmPerWeek: number;
  evKmPerWeek: number;
  publicTransitKmPerWeek: number;
  // Aviation (annual hours)
  shortHaulFlightHoursPerYear: number;
  longHaulFlightHoursPerYear: number;
  // Household Energy (monthly)
  electricityKwhPerMonth: number;
  renewableElectricityPercent: number; // 0 to 100
  naturalGasKwhPerMonth: number;
  // Diet & Waste
  diet: DietaryPattern;
  recyclesPaperAndMetals: boolean;
  compostsOrganicWaste: boolean;
}

export interface EmissionFactorCitation {
  id: string;
  activity: string;
  factorValue: string;
  unit: string;
  sourceReference: string;
  notes: string;
}

/**
 * Published reference emission factors used for educational estimation.
 */
export const EMISSION_FACTORS = {
  carPetrolKgPerKm: 0.17,      // UK DESNZ / DEFRA average medium petrol car (~0.170 kg CO2e/km)
  evGridKgPerKm: 0.05,         // Average battery electric vehicle on mixed grid (~0.050 kg CO2e/km)
  publicTransitKgPerKm: 0.04,  // Average urban rail / bus transit (~0.040 kg CO2e/passenger-km)
  shortHaulFlightKgPerHour: 150, // Economy short-haul ~150 kg CO2e per flight hour
  longHaulFlightKgPerHour: 195,  // Economy long-haul ~195 kg CO2e per flight hour (with radiative forcing)
  gridElectricityKgPerKwh: 0.38, // Global/OECD illustrative mixed grid average (~0.38 kg CO2e/kWh)
  renewableElectricityKgPerKwh: 0.02, // Lifecycle wind/solar amortization (~0.02 kg CO2e/kWh)
  naturalGasKgPerKwh: 0.183,   // UK DESNZ / US EPA natural gas combustion (~0.183 kg CO2e/kWh)
  dietAnnualKgPerPerson: {
    'omnivore-high': 2500,
    'omnivore-moderate': 1850,
    vegetarian: 1250,
    vegan: 950,
  } as Record<DietaryPattern, number>,
  baseWasteKgPerPerson: 380,
  recyclingReductionKg: 110,
  compostingReductionKg: 90,
};

export const CITATION_TABLE: EmissionFactorCitation[] = [
  {
    id: 'ef-car',
    activity: 'Passenger Car (Petrol / Gasoline)',
    factorValue: '0.170',
    unit: 'kg CO2e / km',
    sourceReference: 'UK DESNZ / DEFRA Greenhouse Gas Conversion Factors',
    notes: 'Average medium passenger vehicle tailpipe + fuel supply.',
  },
  {
    id: 'ef-ev',
    activity: 'Battery Electric Vehicle (BEV)',
    factorValue: '0.050',
    unit: 'kg CO2e / km',
    sourceReference: 'UK DESNZ / IEA Global EV Outlook',
    notes: 'Assumes average mixed electricity grid charging.',
  },
  {
    id: 'ef-transit',
    activity: 'Public Transit (Rail & Bus)',
    factorValue: '0.040',
    unit: 'kg CO2e / passenger-km',
    sourceReference: 'UK DESNZ / US EPA Emission Factors Hub',
    notes: 'Weighted average across commuter rail and municipal bus.',
  },
  {
    id: 'ef-flight',
    activity: 'Commercial Aviation (Short / Long Haul)',
    factorValue: '150 / 195',
    unit: 'kg CO2e / flight hour',
    sourceReference: 'ICAO Carbon Emissions Calculator & DEFRA',
    notes: 'Economy class seating assuming 800 km/h cruise speed.',
  },
  {
    id: 'ef-elec',
    activity: 'Household Grid Electricity',
    factorValue: '0.380',
    unit: 'kg CO2e / kWh',
    sourceReference: 'IEA / US EPA eGRID & OECD Reference Average',
    notes: 'Adjusted proportionally by user-specified renewable tariff share.',
  },
  {
    id: 'ef-gas',
    activity: 'Mains Natural Gas Heating',
    factorValue: '0.183',
    unit: 'kg CO2e / kWh',
    sourceReference: 'UK DESNZ / US EPA Stationary Combustion',
    notes: 'Gross calorific value natural gas heating.',
  },
  {
    id: 'ef-diet',
    activity: 'Dietary Food Production',
    factorValue: '950 – 2,500',
    unit: 'kg CO2e / person / year',
    sourceReference: 'Poore & Nemecek (2018), Science / IPCC AR6 WGIII',
    notes: 'Annualized food supply chain estimate by dietary profile.',
  },
];

export const BASELINE_SCENARIO: ActivityScenarioInput = {
  name: 'Current Baseline Household',
  householdSize: 2,
  carPetrolKmPerWeek: 180,
  evKmPerWeek: 0,
  publicTransitKmPerWeek: 30,
  shortHaulFlightHoursPerYear: 6,
  longHaulFlightHoursPerYear: 8,
  electricityKwhPerMonth: 420,
  renewableElectricityPercent: 20,
  naturalGasKwhPerMonth: 550,
  diet: 'omnivore-moderate',
  recyclesPaperAndMetals: true,
  compostsOrganicWaste: false,
};

export const TARGET_SCENARIO: ActivityScenarioInput = {
  name: 'Low-Carbon Transition Plan',
  householdSize: 2,
  carPetrolKmPerWeek: 40,
  evKmPerWeek: 90,
  publicTransitKmPerWeek: 80,
  shortHaulFlightHoursPerYear: 4,
  longHaulFlightHoursPerYear: 0,
  electricityKwhPerMonth: 360,
  renewableElectricityPercent: 85,
  naturalGasKwhPerMonth: 280,
  diet: 'vegetarian',
  recyclesPaperAndMetals: true,
  compostsOrganicWaste: true,
};

export interface FootprintBreakdown {
  surfaceTransportKg: number;
  aviationKg: number;
  electricityKg: number;
  heatingGasKg: number;
  dietKg: number;
  wasteKg: number;
  totalAnnualKg: number;
  perCapitaAnnualKg: number;
}

/**
 * Calculates annualized per-capita and total household emissions in kg CO2e/year.
 * Household energy (electricity & gas) is divided by householdSize to yield per-capita share,
 * while personal transport, flights, diet, and waste are modeled per individual commuter.
 */
export function calculateScenarioFootprint(input: ActivityScenarioInput): FootprintBreakdown {
  const safeHousehold = Math.max(1, Math.round(input.householdSize || 1));

  const surfaceTransportKg =
    (Math.max(0, input.carPetrolKmPerWeek) * EMISSION_FACTORS.carPetrolKgPerKm +
      Math.max(0, input.evKmPerWeek) * EMISSION_FACTORS.evGridKgPerKm +
      Math.max(0, input.publicTransitKmPerWeek) * EMISSION_FACTORS.publicTransitKgPerKm) *
    52;

  const aviationKg =
    Math.max(0, input.shortHaulFlightHoursPerYear) *
      EMISSION_FACTORS.shortHaulFlightKgPerHour +
    Math.max(0, input.longHaulFlightHoursPerYear) *
      EMISSION_FACTORS.longHaulFlightKgPerHour;

  const renewShare = Math.max(0, Math.min(100, input.renewableElectricityPercent)) / 100;
  const effectiveElecFactor =
    renewShare * EMISSION_FACTORS.renewableElectricityKgPerKwh +
    (1 - renewShare) * EMISSION_FACTORS.gridElectricityKgPerKwh;

  const electricityKg =
    (Math.max(0, input.electricityKwhPerMonth) * 12 * effectiveElecFactor) /
    safeHousehold;

  const heatingGasKg =
    (Math.max(0, input.naturalGasKwhPerMonth) * 12 * EMISSION_FACTORS.naturalGasKgPerKwh) /
    safeHousehold;

  const dietKg = EMISSION_FACTORS.dietAnnualKgPerPerson[input.diet] ?? 1850;

  let wasteKg = EMISSION_FACTORS.baseWasteKgPerPerson;
  if (input.recyclesPaperAndMetals) wasteKg -= EMISSION_FACTORS.recyclingReductionKg;
  if (input.compostsOrganicWaste) wasteKg -= EMISSION_FACTORS.compostingReductionKg;

  const perCapitaAnnualKg = Math.round(
    surfaceTransportKg + aviationKg + electricityKg + heatingGasKg + dietKg + wasteKg
  );

  const totalAnnualKg = Math.round(perCapitaAnnualKg * safeHousehold);

  return {
    surfaceTransportKg: Math.round(surfaceTransportKg),
    aviationKg: Math.round(aviationKg),
    electricityKg: Math.round(electricityKg),
    heatingGasKg: Math.round(heatingGasKg),
    dietKg: Math.round(dietKg),
    wasteKg: Math.round(wasteKg),
    perCapitaAnnualKg,
    totalAnnualKg,
  };
}

export interface ReductionRecommendation {
  id: string;
  title: string;
  category: string;
  estimatedAnnualSavingKg: number;
  explanation: string;
}

/**
 * Generates ranked, actionable reduction recommendations tailored to the user's baseline inputs.
 */
export function generateReductionPathways(
  baseline: ActivityScenarioInput
): ReductionRecommendation[] {
  const recs: ReductionRecommendation[] = [];
  const hh = Math.max(1, baseline.householdSize);

  if (baseline.carPetrolKmPerWeek > 50) {
    const shiftKm = Math.round(baseline.carPetrolKmPerWeek * 0.5);
    const saved = Math.round(
      shiftKm *
        52 *
        (EMISSION_FACTORS.carPetrolKgPerKm - EMISSION_FACTORS.publicTransitKgPerKm)
    );
    recs.push({
      id: 'rec-transit',
      title: `Shift ${shiftKm} km/week from petrol driving to rail/bus or EV`,
      category: 'Surface Transport',
      estimatedAnnualSavingKg: saved,
      explanation:
        'Replacing half of weekly solo petrol commuting with public transit or an electric vehicle cuts tailpipe emissions by ~75% per km.',
    });
  }

  if (baseline.longHaulFlightHoursPerYear >= 4) {
    const saved = Math.round(4 * EMISSION_FACTORS.longHaulFlightKgPerHour);
    recs.push({
      id: 'rec-aviation',
      title: 'Replace one 4-hour flight leg per year with rail or virtual meetings',
      category: 'Aviation',
      estimatedAnnualSavingKg: saved,
      explanation:
        'High-altitude aviation has a concentrated warming footprint (~195 kg CO2e/hr). Avoiding 4 flight hours saves nearly 0.8 tonnes CO2e.',
    });
  }

  if (baseline.renewableElectricityPercent < 80) {
    const currentElec = calculateScenarioFootprint(baseline).electricityKg;
    const greenElec = calculateScenarioFootprint({
      ...baseline,
      renewableElectricityPercent: 100,
    }).electricityKg;
    const saved = Math.max(0, currentElec - greenElec);
    if (saved > 50) {
      recs.push({
        id: 'rec-green-power',
        title: 'Switch household electricity tariff to 100% accredited renewable power',
        category: 'Electricity',
        estimatedAnnualSavingKg: saved,
        explanation:
          'Accredited GreenPower or rooftop solar reduces per-kWh lifecycle emissions from ~0.38 kg to ~0.02 kg CO2e/kWh.',
      });
    }
  }

  if (baseline.naturalGasKwhPerMonth > 200) {
    const saved = Math.round(
      (baseline.naturalGasKwhPerMonth * 0.35 * 12 * EMISSION_FACTORS.naturalGasKgPerKwh) /
        hh
    );
    recs.push({
      id: 'rec-heating',
      title: 'Improve draught sealing & lower heating thermostat by 1–2°C (35% gas reduction)',
      category: 'Heating Energy',
      estimatedAnnualSavingKg: saved,
      explanation:
        'Space heating and hot water dominate residential gas usage; heat-pump upgrades or thermostat optimization yield immediate savings.',
    });
  }

  if (baseline.diet === 'omnivore-high' || baseline.diet === 'omnivore-moderate') {
    const saved =
      EMISSION_FACTORS.dietAnnualKgPerPerson[baseline.diet] -
      EMISSION_FACTORS.dietAnnualKgPerPerson.vegetarian;
    recs.push({
      id: 'rec-diet',
      title: 'Adopt a plant-rich or vegetarian meal plan 5 days a week',
      category: 'Food & Diet',
      estimatedAnnualSavingKg: saved,
      explanation:
        'Ruminant meat and dairy production carry high methane and land-use intensities (Poore & Nemecek, 2018).',
    });
  }

  return recs.sort((a, b) => b.estimatedAnnualSavingKg - a.estimatedAnnualSavingKg);
}

/**
 * Formats a downloadable Markdown sustainability assessment report.
 */
export function buildMarkdownReport(
  baseline: ActivityScenarioInput,
  target: ActivityScenarioInput,
  baseResult: FootprintBreakdown,
  targetResult: FootprintBreakdown
): string {
  const deltaKg = baseResult.perCapitaAnnualKg - targetResult.perCapitaAnnualKg;
  const deltaPct =
    baseResult.perCapitaAnnualKg > 0
      ? Math.round((deltaKg / baseResult.perCapitaAnnualKg) * 1000) / 10
      : 0;

  return `# EcoTrack Sustainability Scenario Assessment Report

Generated Locally: ${new Date().toISOString().slice(0, 10)}

> **Educational Estimate Notice:** All values in this report are educational estimates calculated locally using published average emission factors (UK DESNZ / US EPA / IPCC AR6). They do not represent a certified ISO 14064 carbon audit or live utility telemetry.

## 1. Per-Capita Annual Summary

| Metric | ${baseline.name} | ${target.name} | Net Change |
| :--- | :---: | :---: | :---: |
| **Per-Capita Footprint** | **${baseResult.perCapitaAnnualKg.toLocaleString()} kg CO2e/yr** | **${targetResult.perCapitaAnnualKg.toLocaleString()} kg CO2e/yr** | **-${deltaKg.toLocaleString()} kg (${deltaPct}%)** |
| **Total Household (${baseline.householdSize}p)** | ${baseResult.totalAnnualKg.toLocaleString()} kg CO2e/yr | ${targetResult.totalAnnualKg.toLocaleString()} kg CO2e/yr | -${(baseResult.totalAnnualKg - targetResult.totalAnnualKg).toLocaleString()} kg |

## 2. Category Breakdown (kg CO2e / person / year)

- **Surface Transport:** ${baseResult.surfaceTransportKg} kg -> ${targetResult.surfaceTransportKg} kg
- **Commercial Aviation:** ${baseResult.aviationKg} kg -> ${targetResult.aviationKg} kg
- **Electricity Share:** ${baseResult.electricityKg} kg -> ${targetResult.electricityKg} kg
- **Heating & Gas Share:** ${baseResult.heatingGasKg} kg -> ${targetResult.heatingGasKg} kg
- **Dietary Footprint:** ${baseResult.dietKg} kg -> ${targetResult.dietKg} kg
- **Waste & Recycling:** ${baseResult.wasteKg} kg -> ${targetResult.wasteKg} kg
`;
}
