import { useState, useEffect, useMemo } from 'react';
import {
  Leaf,
  Car,
  Zap,
  Plane,
  Utensils,
  Download,
  BookOpen,
  RotateCcw,
  TrendingDown,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  ActivityScenarioInput,
  DietaryPattern,
  RegionPresetId,
  REGIONAL_PRESETS,
  BASELINE_SCENARIO,
  TARGET_SCENARIO,
  getCitationTableForRegion,
  calculateScenarioFootprint,
  generateReductionPathways,
  buildMarkdownReport,
} from './utils/carbonEngine';

type ViewMode = 'simulator' | 'methodology';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('simulator');
  const [regionId, setRegionId] = useState<RegionPresetId>('uk');
  const [baseline, setBaseline] = useState<ActivityScenarioInput>(BASELINE_SCENARIO);
  const [target, setTarget] = useState<ActivityScenarioInput>(TARGET_SCENARIO);
  const [activeEditor, setActiveEditor] = useState<'baseline' | 'target'>('baseline');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as ViewMode | null;
    if (v === 'methodology' || v === 'simulator') {
      setViewMode(v);
    }
  }, []);

  const activeRegionPreset = REGIONAL_PRESETS[regionId];

  const baseFootprint = useMemo(
    () => calculateScenarioFootprint(baseline, regionId),
    [baseline, regionId]
  );
  const targetFootprint = useMemo(
    () => calculateScenarioFootprint(target, regionId),
    [target, regionId]
  );

  const recommendations = useMemo(
    () => generateReductionPathways(baseline, regionId),
    [baseline, regionId]
  );

  const currentModel = activeEditor === 'baseline' ? baseline : target;
  const setCurrentModel = activeEditor === 'baseline' ? setBaseline : setTarget;
  const currentFootprint = activeEditor === 'baseline' ? baseFootprint : targetFootprint;

  const citationRows = useMemo(
    () => getCitationTableForRegion(regionId, currentModel.renewableElectricityPercent),
    [regionId, currentModel.renewableElectricityPercent]
  );

  const annualSavingKg =
    baseFootprint.perCapitaAnnualKg - targetFootprint.perCapitaAnnualKg;
  const savingPercent =
    baseFootprint.perCapitaAnnualKg > 0
      ? Math.round((annualSavingKg / baseFootprint.perCapitaAnnualKg) * 1000) / 10
      : 0;

  const handleDownloadReport = (format: 'md' | 'json') => {
    const content =
      format === 'md'
        ? buildMarkdownReport(baseline, target, baseFootprint, targetFootprint)
        : JSON.stringify(
            {
              generatedAt: new Date().toISOString(),
              regionPreset: activeRegionPreset,
              disclaimer:
                'Educational estimates based on published UK DESNZ, US EPA, EEA, Australian DCCEEW NGA, ICAO, and IPCC AR6 average emission factors.',
              baselineScenario: {
                inputs: { ...baseline, regionId },
                resultsKgCo2e: baseFootprint,
              },
              targetScenario: {
                inputs: { ...target, regionId },
                resultsKgCo2e: targetFootprint,
              },
              netAnnualReductionPerCapitaKg: annualSavingKg,
            },
            null,
            2
          );

    const mime = format === 'md' ? 'text/markdown' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoTrack-Footprint-Report.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusNotice(`Downloaded ${format.toUpperCase()} sustainability scenario report.`);
  };

  const handleResetScenarios = () => {
    setRegionId('uk');
    setBaseline(BASELINE_SCENARIO);
    setTarget(TARGET_SCENARIO);
    setStatusNotice('Restored default UK regional preset, Baseline, and Low-Carbon Transition scenarios.');
  };

  const comparisonRows = [
    {
      label: 'Surface Transport (Car, EV, Transit)',
      base: baseFootprint.surfaceTransportKg,
      target: targetFootprint.surfaceTransportKg,
      color: 'bg-teal-600',
    },
    {
      label: 'Commercial Aviation (Short & Long Haul)',
      base: baseFootprint.aviationKg,
      target: targetFootprint.aviationKg,
      color: 'bg-sky-600',
    },
    {
      label: 'Household Electricity (Per-Capita Share)',
      base: baseFootprint.electricityKg,
      target: targetFootprint.electricityKg,
      color: 'bg-amber-500',
    },
    {
      label: 'Mains Gas & Heating (Per-Capita Share)',
      base: baseFootprint.heatingGasKg,
      target: targetFootprint.heatingGasKg,
      color: 'bg-orange-600',
    },
    {
      label: 'Dietary Food Supply Chain',
      base: baseFootprint.dietKg,
      target: targetFootprint.dietKg,
      color: 'bg-emerald-600',
    },
    {
      label: 'Household Waste & Recycling',
      base: baseFootprint.wasteKg,
      target: targetFootprint.wasteKg,
      color: 'bg-slate-600',
    },
  ];

  const maxCategoryKg = Math.max(
    ...comparisonRows.flatMap((r) => [r.base, r.target]),
    500
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  EcoTrack
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  Educational Simulator
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Household & commuter carbon footprint calculator with cited emission factors
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="region-preset-select"
                className="text-xs font-mono text-slate-600"
              >
                Region:
              </label>
              <select
                id="region-preset-select"
                aria-label="Regional emission factor preset"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value as RegionPresetId)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 cursor-pointer"
              >
                {Object.values(REGIONAL_PRESETS).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('simulator')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'simulator'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Scenario Simulator & Charts
              </button>
              <button
                type="button"
                onClick={() => setViewMode('methodology')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'methodology'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Methodology & Citations
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetScenarios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
              Reset Defaults
            </button>

            <button
              type="button"
              onClick={() => handleDownloadReport('md')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report (.md)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Transparent Educational Notice Banner */}
        <div className="p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 text-teal-950 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong>Educational Estimation Scope ({activeRegionPreset.shortLabel}):</strong> Figures are order-of-magnitude educational estimates for scenario comparison, not precise personal carbon measurements, smart-meter telemetry, or certified GHG audits. Regional grid ({activeRegionPreset.gridElectricityKgPerKwh.toFixed(3)} kg CO₂e/kWh), EV charging, transport, and gas factors come from{' '}
            <strong>{activeRegionPreset.sourceAuthority}</strong> ({activeRegionPreset.geographicOrigin}); aviation (ICAO) and diet (Poore &amp; Nemecek 2018 / IPCC AR6) use global meta-analysis factors.
          </div>
        </div>

        {statusNotice && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {statusNotice}
            </span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Comparison Cards */}
        <section
          aria-label="Scenario comparison summary"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-mono uppercase text-slate-500">
              Scenario A: {baseline.name}
            </span>
            <p
              data-testid="baseline-total"
              className="font-mono text-2xl font-bold text-slate-900 mt-1.5"
            >
              {baseFootprint.perCapitaAnnualKg.toLocaleString()} kg CO₂e / yr
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {(baseFootprint.perCapitaAnnualKg / 1000).toFixed(2)} tonnes per person •{' '}
              {(baseFootprint.totalAnnualKg / 1000).toFixed(2)}t household total
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs">
            <span className="text-xs font-mono uppercase text-teal-700 font-semibold">
              Scenario B: {target.name}
            </span>
            <p
              data-testid="target-total"
              className="font-mono text-2xl font-bold text-teal-800 mt-1.5"
            >
              {targetFootprint.perCapitaAnnualKg.toLocaleString()} kg CO₂e / yr
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {(targetFootprint.perCapitaAnnualKg / 1000).toFixed(2)} tonnes per person •{' '}
              {(targetFootprint.totalAnnualKg / 1000).toFixed(2)}t household total
            </p>
          </div>

          <div className="bg-teal-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-teal-200">
              <span>Estimated Annual Reduction</span>
              <TrendingDown className="w-4 h-4 text-teal-300" />
            </div>
            <p className="font-mono text-2xl font-bold mt-1.5">
              {annualSavingKg >= 0
                ? `-${annualSavingKg.toLocaleString()} kg CO₂e (-${savingPercent}%)`
                : `+${Math.abs(annualSavingKg).toLocaleString()} kg CO₂e (+${Math.abs(savingPercent)}%)`}
            </p>
            <p className="text-xs text-teal-200 mt-1">
              Per person per year when transitioning A → B
            </p>
          </div>
        </section>

        {viewMode === 'methodology' ? (
          /* METHODOLOGY & CITATIONS VIEW */
          <section
            aria-labelledby="methodology-heading"
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 id="methodology-heading" className="text-lg font-bold text-slate-900">
                Calculation Methodology, Assumptions & Published Sources
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Every estimate in EcoTrack is computed deterministically from the linear equation{' '}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  Annual Emissions (kg CO₂e) = Activity Volume × Conversion Factor
                </code>
                .
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-mono uppercase text-[11px] text-slate-500 bg-slate-50">
                    <th className="py-3 px-3">Activity Category</th>
                    <th className="py-3 px-3">Geographic Origin</th>
                    <th className="py-3 px-3">Factor Type</th>
                    <th className="py-3 px-3">Conversion Factor</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3">Published Reference Source</th>
                    <th className="py-3 px-3">Modeling Assumption</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citationRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {row.activity}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {row.geographicOrigin}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-teal-900">
                        {row.factorType}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-teal-800">
                        {row.factorValue}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{row.unit}</td>
                      <td className="py-3 px-3 text-slate-800">{row.sourceReference}</td>
                      <td className="py-3 px-3 text-slate-600">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  Per-Capita Allocation of Household Utilities
                </h3>
                <p>
                  Monthly electricity and mains gas consumption are multiplied by 12 months and divided by the configured household size so shared residential energy is fairly attributed on a per-person basis.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  Known Scope Boundaries & Limitations
                </h3>
                <p>
                  This calculator models operational energy, commuting, flights, diet, and residential waste. It does not model embodied carbon in manufactured consumer goods, commercial construction, or regional time-of-day grid marginal intensity.
                </p>
              </div>
            </div>
          </section>
        ) : (
          /* SIMULATOR & COMPARISON VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Activity Sliders */}
            <section
              aria-labelledby="inputs-heading"
              className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 id="inputs-heading" className="text-base font-bold text-slate-900">
                    Configure Activity Inputs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select which scenario to adjust below
                  </p>
                </div>

                <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveEditor('baseline')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      activeEditor === 'baseline'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Edit Scenario A (Baseline)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditor('target')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      activeEditor === 'target'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Edit Scenario B (Transition)
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Transport Group */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-teal-700" /> Weekly Surface Commute (km / week)
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label htmlFor="slider-petrol">Petrol / Gasoline Car</label>
                      <span className="font-mono font-bold">
                        {currentModel.carPetrolKmPerWeek} km/wk
                      </span>
                    </div>
                    <input
                      id="slider-petrol"
                      type="range"
                      min={0}
                      max={500}
                      step={10}
                      value={currentModel.carPetrolKmPerWeek}
                      onChange={(e) =>
                        setCurrentModel({
                          ...currentModel,
                          carPetrolKmPerWeek: Number(e.target.value),
                        })
                      }
                      className="w-full accent-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-ev" className="block text-slate-600 mb-1">
                        Battery EV (km/wk)
                      </label>
                      <input
                        id="input-ev"
                        type="number"
                        min={0}
                        max={1000}
                        value={currentModel.evKmPerWeek}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            evKmPerWeek: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                      <span
                        data-testid="effective-ev-factor"
                        className="block text-[10px] font-mono text-teal-800 mt-1"
                      >
                        Effective EV: {currentFootprint.effectiveEvKgPerKm.toFixed(3)} kg CO₂e/km (at {currentModel.renewableElectricityPercent}% renewable)
                      </span>
                    </div>
                    <div>
                      <label htmlFor="input-transit" className="block text-slate-600 mb-1">
                        Rail / Bus Transit (km/wk)
                      </label>
                      <input
                        id="input-transit"
                        type="number"
                        min={0}
                        max={1000}
                        value={currentModel.publicTransitKmPerWeek}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            publicTransitKmPerWeek: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Aviation Group */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-sky-700" /> Annual Commercial Flights (hours / year)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-shorthaul" className="block text-slate-600 mb-1">
                        Short-Haul (&lt;3h legs)
                      </label>
                      <input
                        id="input-shorthaul"
                        type="number"
                        min={0}
                        max={200}
                        value={currentModel.shortHaulFlightHoursPerYear}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            shortHaulFlightHoursPerYear: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-longhaul" className="block text-slate-600 mb-1">
                        Long-Haul (&gt;3h legs)
                      </label>
                      <input
                        id="input-longhaul"
                        type="number"
                        min={0}
                        max={200}
                        value={currentModel.longHaulFlightHoursPerYear}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            longHaulFlightHoursPerYear: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Household Energy Group */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-600" /> Monthly Household Energy
                    </span>
                    <span
                      data-testid="effective-elec-factor"
                      className="font-mono text-[11px] text-slate-500"
                    >
                      Household Size: {currentModel.householdSize} • Effective Grid: {currentFootprint.effectiveElectricityKgPerKwh.toFixed(3)} kg/kWh
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label htmlFor="input-elec" className="block text-slate-600 mb-1">
                        Electricity (kWh/m)
                      </label>
                      <input
                        id="input-elec"
                        type="number"
                        min={0}
                        max={5000}
                        value={currentModel.electricityKwhPerMonth}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            electricityKwhPerMonth: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-renew" className="block text-slate-600 mb-1">
                        Renewable (%)
                      </label>
                      <input
                        id="input-renew"
                        type="number"
                        min={0}
                        max={100}
                        value={currentModel.renewableElectricityPercent}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            renewableElectricityPercent: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-gas" className="block text-slate-600 mb-1">
                        Natural Gas (kWh/m)
                      </label>
                      <input
                        id="input-gas"
                        type="number"
                        min={0}
                        max={5000}
                        value={currentModel.naturalGasKwhPerMonth}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            naturalGasKwhPerMonth: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Diet & Waste */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-700" /> Dietary Profile & Waste Recovery
                  </div>
                  <div>
                    <label htmlFor="select-diet" className="block text-slate-600 mb-1">
                      Dietary Pattern
                    </label>
                    <select
                      id="select-diet"
                      value={currentModel.diet}
                      onChange={(e) =>
                        setCurrentModel({
                          ...currentModel,
                          diet: e.target.value as DietaryPattern,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="omnivore-high">
                        Frequent Meat & Dairy Omnivore (~2,500 kg/yr)
                      </option>
                      <option value="omnivore-moderate">
                        Moderate Balanced Omnivore (~1,850 kg/yr)
                      </option>
                      <option value="vegetarian">
                        Vegetarian (~1,250 kg/yr)
                      </option>
                      <option value="vegan">
                        100% Plant-Based / Vegan (~950 kg/yr)
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentModel.recyclesPaperAndMetals}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            recyclesPaperAndMetals: e.target.checked,
                          })
                        }
                        className="accent-teal-700"
                      />
                      Recycles Paper, Glass & Metals (-110 kg/yr)
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentModel.compostsOrganicWaste}
                        onChange={(e) =>
                          setCurrentModel({
                            ...currentModel,
                            compostsOrganicWaste: e.target.checked,
                          })
                        }
                        className="accent-teal-700"
                      />
                      Composts Food & Garden Organics (-90 kg/yr)
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Visual Category Comparison & Actionable Reduction Pathways */}
            <div className="lg:col-span-6 space-y-6">
              {/* Side-by-Side Category Comparison Chart */}
              <section
                aria-labelledby="comparison-heading"
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 id="comparison-heading" className="text-base font-bold text-slate-900">
                      Category Impact Comparison (kg CO₂e / person / yr)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Scenario A (Slate bar) vs. Scenario B (Teal bar)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('json')}
                    className="text-xs font-mono text-teal-700 hover:underline cursor-pointer"
                  >
                    Export JSON
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {comparisonRows.map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between font-medium text-slate-800">
                        <span>{row.label}</span>
                        <span className="font-mono text-[11px] flex items-center gap-1.5">
                          <span className="text-slate-500">{row.base} kg</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-teal-800">{row.target} kg</span>
                        </span>
                      </div>

                      {/* Dual Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.round((row.base / maxCategoryKg) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.color} rounded-full transition-all`}
                            style={{
                              width: `${Math.min(100, Math.round((row.target / maxCategoryKg) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* High-Impact Reduction Pathways */}
              <section
                aria-labelledby="pathways-heading"
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5"
              >
                <div className="border-b border-slate-100 pb-2.5">
                  <h2 id="pathways-heading" className="text-base font-bold text-slate-900">
                    Prioritized Reduction Opportunities (From Scenario A)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ranked by estimated annual CO₂e savings based on your Baseline inputs
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {recommendations.map((rec) => (
                    <li
                      key={rec.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {rec.category}
                        </span>
                        <p className="text-xs font-bold text-slate-900 pt-0.5">
                          {rec.title}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {rec.explanation}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 whitespace-nowrap shrink-0">
                        -{rec.estimatedAnnualSavingKg} kg/yr
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <strong>Transparency & Scientific Scope:</strong> EcoTrack is an independent open-source educational tool. Emission factors reference published averages from UK DESNZ/DEFRA, US EPA, and IPCC AR6 WGIII.
          </div>
          <div className="font-mono shrink-0">EcoTrack v1.0 • MIT License</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
