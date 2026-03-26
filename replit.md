# Jordan Data Explorer (JODE)

## Overview
An open-source web application for exploring macroeconomic, demographic, and environmental indicators for Jordan. Aggregates data from World Bank, UN, WHO, and other providers. Features the "Titan" Projection Engine for historical gap-filling and forward-looking projections to 2030. Includes correlation analysis, anomaly detection, data stories, scenario modeling, and data quality scoring.

## Tech Stack
- **Frontend:** React 19 + TypeScript
- **Build System:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router 7 (lazy-loaded routes)
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **Search:** Fuse.js
- **Image Export:** html-to-image
- **Package Manager:** npm
- **Font:** Inter + JetBrains Mono (Google Fonts)

## Project Structure
- `src/components/` — Reusable UI components (Navbar, Footer, ThemeToggle, ExportButton, DownloadChartButton, EmbedButton, InsightsPanel, RelatedDatasets, SourceDrawer, OnboardingTour)
- `src/pages/` — Route-level views:
  - `Home.tsx` — Editorial hero, capabilities grid, methodology section
  - `Overview.tsx` — Sparkline dashboard for all 30 datasets with 5yr change %
  - `Datasets.tsx` — Searchable/filterable catalog with category pills
  - `DatasetView.tsx` — Individual dataset chart with dual Y-axis, event annotations, projections
  - `CompareView.tsx` — Multi-dataset comparison with interactive legend
  - `Correlations.tsx` — Pearson correlation heatmap matrix
  - `Anomalies.tsx` — Z-score anomaly detection feed
  - `Stories.tsx` — Interactive data narratives (3 stories with chapter navigation)
  - `Scenarios.tsx` — Regression-based what-if scenario modeler
  - `Quality.tsx` — Data quality scorecard (completeness, freshness, coverage)
- `src/constants/datasets.ts` — Metadata/config for all 30 supported indicators
- `src/constants/events.ts` — Historical events for chart annotations
- `src/utils/projectionEngine.ts` — "Titan" heuristic projection engine
- `src/utils/statistics.ts` — Pearson correlation, linear regression, anomaly detection, data quality assessment
- `src/context/ThemeContext.tsx` — Dark/Light theme state
- `public/` — Static SVG assets

## Running the App
- Development: `npm run dev` (port 5000)
- Build: `npm run build`

## Workflow
- **Start application**: `npm run dev` on port 5000 (webview)

## Configuration Notes
- Vite configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true` for Replit proxy compatibility
- Data is fetched as CSVs from Our World in Data, cached in `sessionStorage`
- Static deployment configured (`build: npm run build`, `publicDir: dist`)

## Design System
- Editorial data-journalism aesthetic with slate neutrals, blue/violet accents
- Light and dark mode with polished transitions
- Sticky navbar with backdrop-blur
- Animation classes: `animate-fade-in`, `animate-fade-in-delay-1/2/3`, `marquee-track`
- Consistent rounded-xl cards with border-slate-200/60 borders

## Features
- **30 Datasets**: Internet, Life Expectancy, CO2, Population, GDP, Electricity, Fertility, Urban, Renewables, Child/Infant Mortality, Literacy, Mobile, Water Scarcity, Unemployment, CPI, HDI, Gov Spending, Health Spending, Female Labor, Protein Supply, Remittances, Electricity Gen, Agricultural Land, Poverty, Youth NEET, Refugees, Tourism, Solar, Primary Energy
- **Sparkline Dashboard**: Overview page with mini charts and 5-year change percentages
- **Correlation Engine**: Pearson heatmap matrix with click-to-detail panel
- **Anomaly Detection**: Z-score analysis (threshold 1.8) with historical event context
- **Data Stories**: 3 interactive narratives (Digital Leap, Health Transformation, Environmental Crossroads)
- **Scenario Modeler**: Regression-based what-if with slider (-50% to +50%)
- **Data Quality Scorecard**: Completeness (40%), freshness (35%), coverage (25%) scoring
- **Titan Forecasting**: Holt-Linear smoothing projections to 2030
- **Country Comparison**: Jordan vs World with dual Y-axis
- **Historical Events**: Annotated chart markers (1967 War, Arab Spring, COVID-19, etc.)
- **Shareable URLs**: Time filter encoded in URL via `useSearchParams`
- **PNG/CSV Export**: Chart image and data export
- **Embed Widget**: iframe code generator
- **Colorblind Palette**: Accessible colors toggle
- **Compare Engine**: Multi-dataset comparison with interactive legend
- **Mobile Responsive**: Hamburger menu, responsive chart heights

## Persistence
- `jode-colorblind` — localStorage — Colorblind preference
- `jode-tour-seen` — localStorage — Onboarding tour dismissed
- `jode-theme` — localStorage — Dark/light theme
- `jode-data-TITAN-v4.6-{id}` — sessionStorage — Cached dataset CSV data
- `jode-spark-{id}` — sessionStorage — Cached sparkline data
- `jode-corr-{id}` — sessionStorage — Cached correlation data
