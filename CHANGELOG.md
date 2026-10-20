# Changelog

## [1.0.1] - 2026-10-20

### Changed
- **Regional Inventory Presets & Verified 2024 Factors:** Added selectable regional presets (`uk`, `us`, `eu`, `au`) aligned with UK DESNZ 2024 (`0.207 kg/kWh`), US EPA GHG Emission Factors Hub 2024 (`0.352 kg/kWh`, Passenger Car `0.190 kg/km`), EEA EU-27 2024 (`0.210 kg/kWh`), and Australian DCCEEW NGA 2024 (`0.650 kg/kWh` national Scope 2 average, `0.186 kg/kWh` natural gas).
- **Dynamic EV & Electricity Consistency:** Computed BEV operational emissions (`kg CO₂e/km`) dynamically from regional BEV energy consumption (`kWh/km`) multiplied by the scenario's effective electricity emission factor.
- **Explicit Factor Classifications & Geographic Origins:** Added `Geographic Origin` and `Factor Type` (`Regional Inventory Average`, `Derived Operational Estimate`, `Global Lifecycle Estimate`) across all 9 methodology citation rows.
- **Report Delta Formatting:** Fixed net-change sign formatting in Markdown reports and KPI cards when Scenario B exceeds Scenario A.

## [1.0.0] - 2026-10-20

### Added
- **Interactive Dual-Scenario Footprint Simulator:** Model and compare *Scenario A (Baseline)* against *Scenario B (Low-Carbon Transition)* across surface transport, aviation, electricity, mains gas heating, diet, and waste.
- **Cited Emission Factors & Methodology View:** Transparent reference table citing UK DESNZ / DEFRA, US EPA, and IPCC AR6 WGIII conversion factors.
- **Prioritized Reduction Pathways:** Ranked actionable recommendations based on baseline activity inputs.
- **Downloadable Reports:** Export scenario comparisons as Markdown (`.md`) or structured JSON (`.json`).
