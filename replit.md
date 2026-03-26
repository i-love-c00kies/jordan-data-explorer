# Jordan Data Explorer (JODE)

## Overview
An open-source web application for exploring macroeconomic, demographic, and environmental indicators for Jordan. Aggregates data from World Bank, UN, WHO, and other providers. Features the "Titan" Projection Engine for historical gap-filling and forward-looking projections to 2030.

## Tech Stack
- **Frontend:** React 19 + TypeScript
- **Build System:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router 7
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **Search:** Fuse.js
- **Image Export:** html-to-image
- **Package Manager:** npm

## Project Structure
- `src/components/` — Reusable UI components (Navbar, Footer, ExportButton, DownloadChartButton, EmbedButton, InsightsPanel, RelatedDatasets, SourceDrawer, OnboardingTour)
- `src/pages/` — Route-level views (Home, Datasets, DatasetView, CompareView)
- `src/constants/datasets.ts` — Metadata/config for all 30 supported indicators
- `src/constants/events.ts` — Historical events for chart annotations
- `src/utils/projectionEngine.ts` — "Titan" heuristic projection engine
- `src/context/ThemeContext.tsx` — Dark/Light theme state
- `public/` — Static SVG assets

## Running the App
- Development: `npm run dev` (port 5000)
- Build: `npm run build`

## Workflow
- **Start application**: `npm run dev` on port 5000 (webview)

## Configuration Notes
- Vite configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true` for Replit proxy compatibility
- Data is fetched as CSVs from Our World in Data, cached in `sessionStorage` with key `jode-data-TITAN-v4.6-{id}`
- Static deployment configured (`build: npm run build`, `publicDir: dist`)

## Features
- **30 Datasets**: Internet, Life Expectancy, CO2, Population, GDP, Electricity, Fertility, Urban, Renewables, Child/Infant Mortality, Literacy, Mobile, Water Scarcity, Unemployment, CPI, HDI, Gov Spending, Health Spending, Female Labor, Protein Supply, Remittances, Electricity Gen, Agricultural Land, Poverty, Youth NEET, Refugees, Tourism, Solar, Primary Energy
- **Shareable URLs**: Time filter encoded in URL via `useSearchParams`
- **PNG Download**: Export chart as image via html-to-image
- **Historical Events**: Annotated chart markers (1967 War, Arab Spring, COVID-19, etc.)
- **Indicator Insights**: Auto-generated trend/range/momentum summaries
- **Related Datasets**: "You might also compare" suggestions
- **Country Comparison**: Jordan vs World and vs MENA with projections
- **Data Source Drawer**: Collapsible source/methodology/gaps panel
- **Embed Widget**: iframe code generator
- **Onboarding Tour**: 3-step first-visit walkthrough (DatasetView only)
- **Colorblind Palette**: Accessible colors toggle (persisted in localStorage)
- **Compare Engine**: Multi-dataset comparison with dual Y-axes, interactive legend
- **Mobile Responsive**: Hamburger menu, responsive chart heights, compact toolbars

## Persistence
- `jode-colorblind` — localStorage — Colorblind preference
- `jode-tour-seen` — localStorage — Onboarding tour dismissed
- `jode-theme` — localStorage — Dark/light theme
- `jode-data-TITAN-v4.6-{id}` — sessionStorage — Cached dataset CSV data
