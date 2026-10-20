export type DietaryPattern = 'omnivore-high' | 'omnivore-moderate' | 'vegetarian' | 'vegan';

export type RegionPresetId = 'uk' | 'us' | 'eu' | 'au';

export interface RegionalEmissionPreset {
  id: RegionPresetId;
  name: string;
  shortLabel: string;
  geographicOrigin: string;
  publicationYear: string;
  sourceAuthority: string;
  gridElectricityKgPerKwh: number;
  carPetrolKgPerKm: number;
  evConsumptionKwhPerKm: number;
  publicTransitKgPerKm: number;
  naturalGasKgPerKwh: number;
}

/**
 * Region-specific emission factor presets from official national/supranational inventories.
 * Each preset uses a single coherent geographic inventory for grid electricity, surface transport,
 * and stationary natural gas heating so regional factors are never silently mixed.
 */
export const REGIONAL_PRESETS: Record<RegionPresetId, RegionalEmissionPreset> = {
  uk: {
    id: 'uk',
    name: 'United Kingdom (DESNZ / DEFRA 2024)',
    shortLabel: 'UK (DESNZ 2024)',
    geographicOrigin: 'United Kingdom (National Inventory)',
    publicationYear: '2024',
    sourceAuthority:
      'UK Department for Energy Security and Net Zero (DESNZ) & DEFRA Greenhouse Gas Conversion Factors 2024',
    gridElectricityKgPerKwh: 0.207,
    carPetrolKgPerKm: 0.17,
    evConsumptionKwhPerKm: 0.18,
    publicTransitKgPerKm: 0.038,
    naturalGasKgPerKwh: 0.183,
  },
  us: {
    id: 'us',
    name: 'United States (US EPA eGRID & GHG Hub 2024)',
    shortLabel: 'US (EPA 2024)',
    geographicOrigin: 'United States (National Average)',
    publicationYear: '2024',
    sourceAuthority:
      'US Environmental Protection Agency (EPA) GHG Emission Factors Hub & eGRID 2024',
    gridElectricityKgPerKwh: 0.386,
    carPetrolKgPerKm: 0.249,
    evConsumptionKwhPerKm: 0.195,
    publicTransitKgPerKm: 0.058,
    naturalGasKgPerKwh: 0.181,
  },
  eu: {
    id: 'eu',
    name: 'European Union (EEA & JRC EU-27 2024)',
    shortLabel: 'EU-27 (EEA 2024)',
    geographicOrigin: 'European Union (EU-27 Member States Average)',
    publicationYear: '2024',
    sourceAuthority:
      'European Environment Agency (EEA) Greenhouse Gas Emission Intensity & EC Joint Research Centre 2024',
    gridElectricityKgPerKwh: 0.251,
    carPetrolKgPerKm: 0.164,
    evConsumptionKwhPerKm: 0.175,
    publicTransitKgPerKm: 0.033,
    naturalGasKgPerKwh: 0.202,
  },
  au: {
    id: 'au',
    name: 'Australia (DCCEEW National Greenhouse Accounts 2024)',
    shortLabel: 'Australia (NGA 2024)',
    geographicOrigin: 'Australia (National Electricity Market & National Inventory)',
    publicationYear: '2024',
    sourceAuthority:
      'Australian Dept. of Climate Change, Energy, the Environment and Water (DCCEEW) National Greenhouse Accounts Factors 2024',
    gridElectricityKgPerKwh: 0.63,
    carPetrolKgPerKm: 0.198,
    evConsumptionKwhPerKm: 0.185,
    publicTransitKgPerKm: 0.048,
    naturalGasKgPerKwh: 0.185,
  },
};

export interface ActivityScenarioInput {
  name: string;
  regionId?: RegionPresetId;
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
  geographicOrigin: string;
  factorValue: string;
  unit: string;
  sourceReference: string;
  notes: string;
}

/**
 * Global / transboundary reference constants (aviation, lifecycle renewable amortization,
 * global food supply chain meta-analysis, and residential waste baseline).
 * Regional grid, vehicle, and heating factors are resolved from REGIONAL_PRESETS[regionId].
 */
export const EMISSION_FACTORS = {
  carPetrolKgPerKm: REGIONAL_PRESETS.uk.carPetrolKgPerKm,
  evConsumptionKwhPerKm: REGIONAL_PRESETS.uk.evConsumptionKwhPerKm,
  publicTransitKgPerKm: REGIONAL_PRESETS.uk.publicTransitKgPerKm,
  shortHaulFlightKgPerHour: 150, // ICAO / DEFRA economy short-haul (~150 kg CO2e per flight hour)
  longHaulFlightKgPerHour: 195,  // ICAO / DEFRA economy long-haul (~195 kg CO2e per flight hour)
  gridElectricityKgPerKwh: REGIONAL_PRESETS.uk.gridElectricityKgPerKwh,
  renewableElectricityKgPerKwh: 0.02, // IPCC AR6 WGIII lifecycle wind/solar amortization (~0.02 kg CO2e/kWh)
  naturalGasKgPerKwh: REGIONAL_PRESETS.uk.naturalGasKgPerKwh,
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

/**
 * Computes the effective electricity emission factor (kg CO2e / kWh) for the selected region
 * and user-specified renewable electricity share (0-100%).
 */
export function calculateEffectiveElectricityFactor(
  regionId: RegionPresetId,
  renewableElectricityPercent: number
): number {
  const preset = REGIONAL_PRESETS[regionId] ?? REGIONAL_PRESETS.uk;
  const renewShare = Math.max(0, Math.min(100, renewableElectricityPercent)) / 100;
  return (
    renewShare * EMISSION_FACTORS.renewableElectricityKgPerKwh +
    (1 - renewShare) * preset.gridElectricityKgPerKwh
  );
}

/**
 * Computes Battery Electric Vehicle (BEV) operational emissions (kg CO2e / km) consistently
 * from the active region's BEV kWh/km consumption and the scenario's effective electricity factor.
 */
export function calculateEvKgPerKm(
  regionId: RegionPresetId,
  renewableElectricityPercent: number
): number {
  const preset = REGIONAL_PRESETS[regionId] ?? REGIONAL_PRESETS.uk;
  const effectiveElecKgPerKwh = calculateEffectiveElectricityFactor(
    regionId,
    renewableElectricityPercent
  );
  return preset.evConsumptionKwhPerKm * effectiveElecKgPerKwh;
}

/**
 * Returns the explicit citation table for a given regional preset, clearly distinguishing
 * national inventory factors from international/global lifecycle meta-analyses.
 */
export function getCitationTableForRegion(
  regionId: RegionPresetId = 'uk',
  renewableElectricityPercent = 0
): EmissionFactorCitation[] {
  const preset = REGIONAL_PRESETS[regionId] ?? REGIONAL_PRESETS.uk;
  const evFactorAtZeroRenew = (
    preset.evConsumptionKwhPerKm * preset.gridElectricityKgPerKwh
  ).toFixed(3);
  const evFactorAtActiveRenew = calculateEvKgPerKm(
    regionId,
    renewableElectricityPercent
  ).toFixed(3);

  return [
    {
      id: 'ef-car',
      activity: 'Passenger Car (Petrol / Gasoline)',
      geographicOrigin: preset.geographicOrigin,
      factorValue: preset.carPetrolKgPerKm.toFixed(3),
      unit: 'kg CO2e / km',
      sourceReference: `${preset.sourceAuthority} (${preset.publicationYear})`,
      notes: 'Average passenger petrol vehicle tailpipe combustion.',
    },
    {
      id: 'ef-ev',
      activity: 'Battery Electric Vehicle (BEV)',
      geographicOrigin: preset.geographicOrigin,
      factorValue: `${evFactorAtActiveRenew} (grid base: ${evFactorAtZeroRenew})`,
      unit: 'kg CO2e / km',
      sourceReference: `${preset.sourceAuthority} (${preset.publicationYear})`,
      notes: `Derived dynamically as ${preset.evConsumptionKwhPerKm.toFixed(3)} kWh/km × effective electricity factor (scales with regional grid & renewable % share).`,
    },
    {
      id: 'ef-transit',
      activity: 'Public Transit (Rail & Bus)',
      geographicOrigin: preset.geographicOrigin,
      factorValue: preset.publicTransitKgPerKm.toFixed(3),
      unit: 'kg CO2e / passenger-km',
      sourceReference: `${preset.sourceAuthority} (${preset.publicationYear})`,
      notes: 'Weighted regional average across commuter rail and municipal bus.',
    },
    {
      id: 'ef-elec',
      activity: 'Household Grid Electricity (Unblended Base)',
      geographicOrigin: preset.geographicOrigin,
      factorValue: preset.gridElectricityKgPerKwh.toFixed(3),
      unit: 'kg CO2e / kWh',
      sourceReference: `${preset.sourceAuthority} (${preset.publicationYear})`,
      notes: `Blended linearly with lifecycle renewable electricity (${EMISSION_FACTORS.renewableElectricityKgPerKwh.toFixed(2)} kg CO2e/kWh) using your renewable % setting.`,
    },
    {
      id: 'ef-gas',
      activity: 'Mains Natural Gas Heating',
      geographicOrigin: preset.geographicOrigin,
      factorValue: preset.naturalGasKgPerKwh.toFixed(3),
      unit: 'kg CO2e / kWh',
      sourceReference: `${preset.sourceAuthority} (${preset.publicationYear})`,
      notes: 'Residential stationary natural gas combustion.',
    },
    {
      id: 'ef-flight',
      activity: 'Commercial Aviation (Short / Long Haul)',
      geographicOrigin: 'International / Global Aviation (Transboundary)',
      factorValue: '150 / 195',
      unit: 'kg CO2e / flight hour',
      sourceReference: 'ICAO Carbon Emissions Calculator & UK DESNZ Aviation Methodology (2024)',
      notes: 'Economy class seating assuming ~800 km/h block speed (global transboundary factor).',
    },
    {
      id: 'ef-diet',
      activity: 'Dietary Food Supply Chain',
      geographicOrigin: 'Global Meta-Analysis (119 Countries)',
      factorValue: '950 – 2,500',
      unit: 'kg CO2e / person / year',
      sourceReference: 'Poore & Nemecek (2018), Science / IPCC AR6 WGIII (2022)',
      notes: 'Order-of-magnitude global food system estimate by dietary pattern; not a region-specific farm audit.',
    },
  ];
}

export const CITATION_TABLE: EmissionFactorCitation[] = getCitationTableForRegion('uk', 20);

export const BASELINE_SCENARIO: ActivityScenarioInput = {
  name: 'Current Baseline Household',
  regionId: 'uk',
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
  regionId: 'uk',
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
  regionId: RegionPresetId;
  effectiveElectricityKgPerKwh: number;
  effectiveEvKgPerKm: number;
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
 * Uses the active region preset consistently across grid electricity, EV charging,
 * petrol vehicles, public transit, and natural gas heating.
 */
export function calculateScenarioFootprint(
  input: ActivityScenarioInput,
  regionOverride?: RegionPresetId
): FootprintBreakdown {
  const regionId: RegionPresetId = regionOverride ?? input.regionId ?? 'uk';
  const preset = REGIONAL_PRESETS[regionId] ?? REGIONAL_PRESETS.uk;
  const safeHousehold = Math.max(1, Math.round(input.householdSize || 1));

  const effectiveElecFactor = calculateEffectiveElectricityFactor(
    regionId,
    input.renewableElectricityPercent
  );
  const effectiveEvKgPerKm = calculateEvKgPerKm(
    regionId,
    input.renewableElectricityPercent
  );

  const surfaceTransportKg =
    (Math.max(0, input.carPetrolKmPerWeek) * preset.carPetrolKgPerKm +
      Math.max(0, input.evKmPerWeek) * effectiveEvKgPerKm +
      Math.max(0, input.publicTransitKmPerWeek) * preset.publicTransitKgPerKm) *
    52;

  const aviationKg =
    Math.max(0, input.shortHaulFlightHoursPerYear) *
      EMISSION_FACTORS.shortHaulFlightKgPerHour +
    Math.max(0, input.longHaulFlightHoursPerYear) *
      EMISSION_FACTORS.longHaulFlightKgPerHour;

  const electricityKg =
    (Math.max(0, input.electricityKwhPerMonth) * 12 * effectiveElecFactor) /
    safeHousehold;

  const heatingGasKg =
    (Math.max(0, input.naturalGasKwhPerMonth) * 12 * preset.naturalGasKgPerKwh) /
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
    regionId,
    effectiveElectricityKgPerKwh: Math.round(effectiveElecFactor * 1000) / 1000,
    effectiveEvKgPerKm: Math.round(effectiveEvKgPerKm * 1000) / 1000,
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
 * Generates ranked, actionable reduction recommendations tailored to the user's baseline inputs
 * and active regional emission factors.
 */
export function generateReductionPathways(
  baseline: ActivityScenarioInput,
  regionOverride?: RegionPresetId
): ReductionRecommendation[] {
  const regionId: RegionPresetId = regionOverride ?? baseline.regionId ?? 'uk';
  const preset = REGIONAL_PRESETS[regionId] ?? REGIONAL_PRESETS.uk;
  const recs: ReductionRecommendation[] = [];
  const hh = Math.max(1, baseline.householdSize);

  if (baseline.carPetrolKmPerWeek > 50) {
    const shiftKm = Math.round(baseline.carPetrolKmPerWeek * 0.5);
    const evKgPerKm = calculateEvKgPerKm(regionId, baseline.renewableElectricityPercent);
    const comparisonTargetFactor = Math.min(preset.publicTransitKgPerKm, evKgPerKm);
    const saved = Math.max(
      0,
      Math.round(shiftKm * 52 * (preset.carPetrolKgPerKm - comparisonTargetFactor))
    );
    recs.push({
      id: 'rec-transit',
      title: `Shift ${shiftKm} km/week from petrol driving to rail/bus or EV`,
      category: 'Surface Transport',
      estimatedAnnualSavingKg: saved,
      explanation: `In ${preset.shortLabel}, replacing half of weekly petrol driving (${preset.carPetrolKgPerKm.toFixed(3)} kg/km) with transit (${preset.publicTransitKgPerKm.toFixed(3)} kg/km) or EV charging (${evKgPerKm.toFixed(3)} kg/km at ${baseline.renewableElectricityPercent}% renewable electricity) significantly lowers transport emissions.`,
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
    const currentFootprint = calculateScenarioFootprint(baseline, regionId);
    const greenFootprint = calculateScenarioFootprint(
      {
        ...baseline,
        renewableElectricityPercent: 100,
      },
      regionId
    );
    const saved = Math.max(
      0,
      currentFootprint.electricityKg +
        currentFootprint.surfaceTransportKg -
        (greenFootprint.electricityKg + greenFootprint.surfaceTransportKg)
    );
    if (saved > 30) {
      recs.push({
        id: 'rec-green-power',
        title: 'Switch electricity supply to 100% accredited renewable power',
        category: 'Electricity & EV Charging',
        estimatedAnnualSavingKg: saved,
        explanation: `In ${preset.shortLabel}, switching from the regional grid average (${preset.gridElectricityKgPerKwh.toFixed(3)} kg CO2e/kWh) to accredited renewable electricity (~${EMISSION_FACTORS.renewableElectricityKgPerKwh.toFixed(2)} kg CO2e/kWh lifecycle) cuts both home electricity and EV charging emissions.`,
      });
    }
  }

  if (baseline.naturalGasKwhPerMonth > 200) {
    const saved = Math.round(
      (baseline.naturalGasKwhPerMonth * 0.35 * 12 * preset.naturalGasKgPerKwh) / hh
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
  const regionPreset =
    REGIONAL_PRESETS[baseResult.regionId] ?? REGIONAL_PRESETS.uk;
  const deltaKg = baseResult.perCapitaAnnualKg - targetResult.perCapitaAnnualKg;
  const deltaPct =
    baseResult.perCapitaAnnualKg > 0
      ? Math.round((deltaKg / baseResult.perCapitaAnnualKg) * 1000) / 10
      : 0;

  return `# EcoTrack Sustainability Scenario Assessment Report

Generated Locally: ${new Date().toISOString().slice(0, 10)}
Regional Inventory Preset: **${regionPreset.name}** (${regionPreset.geographicOrigin})
Primary Regional Source: ${regionPreset.sourceAuthority}

> **Educational Estimate Notice:** All values in this report are order-of-magnitude educational estimates for scenario comparison, not precise personal carbon measurements, smart-meter telemetry, or a certified ISO 14064 carbon audit. National factors (${regionPreset.shortLabel}) are applied to electricity, EV charging, surface transport, and heating gas; global meta-analysis factors are applied to aviation (ICAO) and diet (Poore & Nemecek 2018 / IPCC AR6).

## 1. Per-Capita Annual Summary

| Metric | ${baseline.name} | ${target.name} | Net Change |
| :--- | :---: | :---: | :---: |
| **Per-Capita Footprint** | **${baseResult.perCapitaAnnualKg.toLocaleString()} kg CO2e/yr** | **${targetResult.perCapitaAnnualKg.toLocaleString()} kg CO2e/yr** | **-${deltaKg.toLocaleString()} kg (${deltaPct}%)** |
| **Total Household (${baseline.householdSize}p)** | ${baseResult.totalAnnualKg.toLocaleString()} kg CO2e/yr | ${targetResult.totalAnnualKg.toLocaleString()} kg CO2e/yr | -${(baseResult.totalAnnualKg - targetResult.totalAnnualKg).toLocaleString()} kg |
| **Effective Electricity Factor** | ${baseResult.effectiveElectricityKgPerKwh.toFixed(3)} kg CO2e/kWh | ${targetResult.effectiveElectricityKgPerKwh.toFixed(3)} kg CO2e/kWh | — |
| **Effective BEV Factor** | ${baseResult.effectiveEvKgPerKm.toFixed(3)} kg CO2e/km | ${targetResult.effectiveEvKgPerKm.toFixed(3)} kg CO2e/km | — |

## 2. Category Breakdown (kg CO2e / person / year)

- **Surface Transport:** ${baseResult.surfaceTransportKg} kg -> ${targetResult.surfaceTransportKg} kg
- **Commercial Aviation:** ${baseResult.aviationKg} kg -> ${targetResult.aviationKg} kg
- **Electricity Share:** ${baseResult.electricityKg} kg -> ${targetResult.electricityKg} kg
- **Heating & Gas Share:** ${baseResult.heatingGasKg} kg -> ${targetResult.heatingGasKg} kg
- **Dietary Footprint:** ${baseResult.dietKg} kg -> ${targetResult.dietKg} kg
- **Waste & Recycling:** ${baseResult.wasteKg} kg -> ${targetResult.wasteKg} kg
`;
}
