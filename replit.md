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
  - `Overview.tsx` — Sparkline dashboard for all 100 datasets with 5yr change %
  - `Datasets.tsx` — Searchable/filterable catalog with category pills
  - `DatasetView.tsx` — Individual dataset chart with dual Y-axis, event annotations, projections
  - `CompareView.tsx` — Multi-dataset comparison with interactive legend
  - `Correlations.tsx` — Pearson correlation heatmap matrix
  - `Anomalies.tsx` — Z-score anomaly detection feed
  - `Stories.tsx` — Interactive data narratives (3 stories with chapter navigation)
  - `Scenarios.tsx` — Regression-based what-if scenario modeler
  - `Quality.tsx` — Data quality scorecard (completeness, freshness, coverage)
- `src/constants/datasets.ts` — Metadata/config for all 100 supported indicators (9 categories)
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

## Dataset Categories (9)
- **Technology** (4): Internet, Mobile, Broadband, Secure Servers, R&D
- **Health** (17): Life Expectancy, Child/Infant/Neonatal Mortality, Maternal Mortality, Hospital Beds, Physicians, Nurses, Vaccinations, Obesity, Smoking, Diabetes, TB, Anemia, Health Expenditure, Caloric/Protein Supply, Skilled Birth Attendance
- **Environment** (14): CO₂, CO₂ per Capita, Methane, N₂O, GHG per Capita, PM2.5, Forest, Renewables, Solar, Wind, Fossil Fuels, Water Use, Arable Land, Carbon Intensity, Agricultural Land, Water Scarcity
- **Demographics** (10): Population, Fertility, Urban Share, HDI, Female Labor, Net Migration, Median Age, Dependency Ratio, Population Density, Natural Growth, Gender Wage Gap, Refugees
- **Economy** (13): GDP, GDP per Capita, Unemployment, CPI, Inflation, Gov Spending, Gov Debt, Tax Revenue, GINI, Remittances, Tourism, Labor Productivity, Agriculture/Manufacturing/Services GDP shares
- **Infrastructure** (7): Electricity Access/Generation, Primary Energy, Gas/Oil Electricity, Energy per Capita, Clean Cooking, Clean Water, Sanitation
- **Education** (8): Primary/Secondary/Tertiary Enrollment, Education Spending, Mean/Expected Years of Schooling, Primary Completion, Pupil-Teacher Ratio, Youth NEET
- **Governance** (6): Military Spending, Corruption, Democracy, Human Rights, Women in Parliament, Press Freedom, Rule of Law
- **Trade** (5): FDI, Trade Openness, Exports, Imports, Merchandise Exports/Imports

## Features
- **100 Datasets** across 9 categories covering technology, health, environment, economy, demographics, infrastructure, education, governance, and trade
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

## Removed Datasets
- Literacy Rate (formerly ID 11) — removed due to sparse Jordan data
- Poverty Rate (formerly ID 25) — removed due to sparse Jordan data

## Persistence
- `jode-colorblind` — localStorage — Colorblind preference
- `jode-tour-seen` — localStorage — Onboarding tour dismissed
- `jode-theme` — localStorage — Dark/light theme
- `jode-data-TITAN-v4.6-{id}` — sessionStorage — Cached dataset CSV data
- `jode-spark-{id}` — sessionStorage — Cached sparkline data
- `jode-corr-{id}` — sessionStorage — Cached correlation data
