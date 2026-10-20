# EcoTrack — Household & Commuter Carbon Footprint Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-0F766E.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![CI](https://github.com/iamnarace/ecotrack/actions/workflows/ci.yml/badge.svg)](https://github.com/iamnarace/ecotrack/actions/workflows/ci.yml)

**EcoTrack** is an educational sustainability dashboard and scenario simulator that models annual household and commuter greenhouse gas emissions (`kg CO₂e / year`), compares baseline habits against low-carbon transition scenarios, highlights prioritized reduction opportunities, and documents every underlying conversion factor and reference source.

---

## Why EcoTrack?

Carbon calculators often act as opaque black boxes that output a single number without explaining the underlying math or letting users compare "what-if" changes side by side.

**EcoTrack** is designed for transparency: it models **Scenario A (Current Baseline)** alongside **Scenario B (Transition Plan)** in real time, ranks practical reduction actions by estimated `kg CO₂e/year` saved, and includes a dedicated **Methodology & Citations** view detailing every emission factor used.

---

## Key Features

- **Side-by-Side Scenario Modeling:** Edit either **Scenario A (Baseline)** or **Scenario B (Transition)** across weekly commuting (`Petrol Car`, `Battery EV`, `Public Transit`), annual short/long-haul flight hours, monthly electricity and renewable tariff share, mains gas heating, dietary pattern, and waste recovery.
- **Category Impact Comparison Charts:** Dual-bar visual comparison across all six emission categories showing exact `kg CO₂e/person/year` shifts.
- **Prioritized Reduction Pathways:** Automatically ranks high-impact reduction opportunities tailored to your current baseline inputs.
- **Published Emission Factor Citations:** Dedicated **Methodology & Citations** tab listing conversion factors, units, and published reference sources (UK DESNZ / DEFRA, US EPA eGRID, ICAO, and Poore & Nemecek 2018 / IPCC AR6 WGIII).
- **Downloadable Reports:** Export your scenario comparison as a clean Markdown report (`.md`) or structured JSON summary (`.json`).

---

## Screenshots

### Desktop — Dual-Scenario Simulator, Category Impact Chart & Reduction Pathways
![EcoTrack Simulator Overview](./docs/screenshots/desktop-simulator.png)

### Feature View — Calculation Methodology & Published Emission Factor Citations
![EcoTrack Methodology & Citations](./docs/screenshots/feature-methodology.png)

### Mobile Responsive View
<p align="left">
  <img src="./docs/screenshots/mobile-view.png" alt="EcoTrack Mobile View" width="340" />
</p>

---

## Technology Stack

- **Framework:** React 18 + TypeScript 5
- **Styling:** Tailwind CSS (Teal, Slate & Amber environmental data visualization theme)
- **Icons:** Lucide React
- **Build & Test:** Vite 5, Vitest, React Testing Library, ESLint

---

## Requirements & Installation

- **Node.js:** v18.18+ or v20+
- **npm:** v9+

```bash
# Clone the repository
git clone https://github.com/iamnarace/ecotrack.git
cd ecotrack

# Install dependencies
npm install
```

---

## Local Development, Build & Testing

```bash
# Start local development server
npm run dev

# Run ESLint static analysis
npm run lint

# Run Vitest unit & component tests
npm test

# Build production bundle
npm run build
```

---

## Calculation Methodology & Published Sources

EcoTrack computes annual per-capita emissions using deterministic linear conversion factors:

| Activity Category | Factor | Unit | Published Source Reference |
| :--- | :---: | :---: | :--- |
| **Petrol / Gasoline Car** | `0.170` | `kg CO₂e / km` | UK DESNZ / DEFRA Greenhouse Gas Conversion Factors |
| **Battery Electric Vehicle** | `0.050` | `kg CO₂e / km` | UK DESNZ / IEA Global EV Outlook (mixed grid charging) |
| **Public Transit (Rail/Bus)** | `0.040` | `kg CO₂e / p-km` | UK DESNZ / US EPA Emission Factors Hub |
| **Commercial Aviation** | `150 / 195` | `kg CO₂e / hr` | ICAO Carbon Emissions Calculator & DEFRA (Short / Long haul) |
| **Grid Electricity** | `0.380` | `kg CO₂e / kWh` | IEA / US EPA eGRID & OECD Reference Average |
| **Mains Natural Gas** | `0.183` | `kg CO₂e / kWh` | UK DESNZ / US EPA Stationary Combustion |
| **Dietary Profiles** | `950 – 2,500` | `kg CO₂e / yr` | Poore & Nemecek (2018), *Science* / IPCC AR6 WGIII |

---

## Project Structure

```text
ecotrack/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── docs/
│   └── screenshots/
├── src/
│   ├── test/
│   │   ├── carbonEngine.test.tsx
│   │   └── setup.ts
│   ├── utils/
│   │   └── carbonEngine.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── package.json
└── vite.config.ts
```

---

## Security, Privacy & Scientific Disclaimer

- **100% Local Processing:** All scenario calculations and report generation happen locally in your browser.
- **Educational Scope & Limitations:** EcoTrack provides educational order-of-magnitude estimates based on published average conversion factors. It does not ingest live smart-meter telemetry, regional real-time grid marginal carbon intensity, or embodied lifecycle emissions of manufactured goods, and is not a substitute for certified ISO 14064 or GHG Protocol corporate audits.

---

## Roadmap

- [ ] Regional electricity grid factor presets (EU, US eGRID subregions, Australia NEM, UK)
- [ ] Rooftop solar & home battery self-consumption estimator
- [ ] CSV multi-scenario export

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

---

## Acknowledgements

Developed with assistance from Google Antigravity.

---

## License

Licensed under the [MIT License](./LICENSE). Copyright (c) 2026 Naresh Adhikari.
