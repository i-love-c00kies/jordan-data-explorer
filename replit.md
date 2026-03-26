# Jordan Data Explorer (JODE)

## Overview
An open-source web application for exploring macroeconomic, demographic, and environmental indicators for Jordan. Aggregates data from World Bank, UN, WHO, and other providers. Features the "Titan" Projection Engine for historical gap-filling and forward-looking projections to 2030. Includes correlation analysis, anomaly detection, data stories, scenario modeling, and data quality scoring.

## Tech Stack
- **Frontend:** React 19 + TypeScript
- **Build System:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router 7 (BrowserRouter with lazy-loaded routes)
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **Search:** Fuse.js
- **Image Export:** html-to-image
- **Package Manager:** npm
- **Font:** Inter + JetBrains Mono (Google Fonts)

## Project Structure
- `src/components/` — Reusable UI components:
  - `Navbar.tsx` — Sticky nav with search button (Ctrl+K), active route highlighting
  - `Footer.tsx`, `ThemeToggle.tsx`
  - `ExportButton.tsx` — CSV export with toast notification
  - `DownloadChartButton.tsx` — PNG chart export with toast notification
  - `EmbedButton.tsx` — iframe embed code generator with copy-to-clipboard toast
  - `InsightsPanel.tsx`, `RelatedDatasets.tsx`, `SourceDrawer.tsx`, `OnboardingTour.tsx`
  - `SearchModal.tsx` — Global Cmd/Ctrl+K search modal (datasets + pages)
  - `Toast.tsx` — Toast notification container
  - `BackToTop.tsx` — Floating back-to-top button (appears after 500px scroll)
- `src/context/` — React contexts:
  - `ThemeContext.tsx` — Dark/Light theme state
  - `ToastContext.tsx` — Global toast notification state (showToast, removeToast)
- `src/services/` — Data layer:
  - `dataService.ts` — Singleton DataService with concurrency-limited fetching (max 6 simultaneous), in-memory + sessionStorage caching
- `src/pages/` — Route-level views:
  - `Home.tsx` — Editorial hero, capabilities grid, methodology section
  - `Overview.tsx` — SVG polyline sparkline dashboard for all 100 datasets, category filter, 5yr change %, progress bar
  - `Datasets.tsx` — Searchable/filterable catalog with category pills (counts), favorites system (star button), URL-persisted category filter (`?cat=`)
  - `DatasetView.tsx` — Individual dataset chart with breadcrumbs (Home › Datasets › Name), favorites star button, YoY% toggle (BarChart view), time filter, events, dual Y-axis, compare, projections
  - `CompareView.tsx` — Multi-dataset comparison with interactive legend
  - `Correlations.tsx` — Pearson correlation heatmap matrix
  - `Anomalies.tsx` — Z-score anomaly detection feed (uses DataService)
  - `Stories.tsx` — Interactive data narratives (9 stories with chapter navigation)
  - `Scenarios.tsx` — Regression-based what-if scenario modeler
  - `Quality.tsx` — Data quality scorecard with progress bar (uses DataService)
- `src/constants/datasets.ts` — Metadata/config for all 100 supported indicators (9 categories)
- `src/constants/events.ts` — Historical events for chart annotations
- `src/utils/projectionEngine.ts` — "Titan" heuristic projection engine
- `src/utils/statistics.ts` — Pearson correlation, linear regression, anomaly detection, data quality assessment
- `public/` — Static SVG assets

## Running the App
- Development: `npm run dev` (port 5000)
- Build: `npm run build`

## Workflow
- **Start application**: `npm run dev` on port 5000 (webview)

## Configuration Notes
- Vite configured with `host: '0.0.0.0'`, `port: 5000`, `allowedHosts: true` for Replit proxy compatibility
- Data is fetched as CSVs from Our World in Data via PapaParse download mode
- DataService (`src/services/dataService.ts`) manages all fetching with max 6 concurrent requests and two-tier cache (memory + sessionStorage key `jode-ds-{id}`)
- Static deployment configured (`build: npm run build`, `publicDir: dist`)
- Note: `useNavigation` from react-router requires a Data Router (createBrowserRouter) — not available with BrowserRouter

## Design System
- Editorial data-journalism aesthetic with slate neutrals, blue/violet accents
- Light and dark mode with polished transitions
- Sticky navbar with backdrop-blur
- Animation classes: `animate-fade-in`, `animate-fade-in-delay-1/2/3`, `marquee-track`, `animate-nav-progress`
- Consistent rounded-xl cards with border-slate-200/60 borders
- Print stylesheet: `@media print` hides nav/footer, removes shadows, forces white background

## Dataset Categories (9)
- **Technology** (5): Internet, Mobile, Broadband, Secure Servers, R&D
- **Health** (21): Life Expectancy, Child/Infant/Neonatal Mortality, Maternal Mortality, Hospital Beds, Physicians, Nurses, Vaccinations, Obesity, Smoking, Diabetes, TB, Anemia, Health Expenditure, Caloric/Protein Supply, Skilled Birth Attendance, **Food Undernourishment** (ID 28, replaces Tourism)
- **Environment** (17): CO₂, CO₂ per Capita, Methane, N₂O, GHG per Capita, PM2.5, Forest, Renewables, Solar, Wind, Fossil Fuels, Water Use, Arable Land, Carbon Intensity, Agricultural Land, Water Scarcity
- **Demographics** (12): Population, Fertility, Urban Share, HDI, Female Labor, Net Migration, Median Age, Dependency Ratio, Population Density, Natural Growth, Gender Wage Gap, Refugees
- **Economy** (14): GDP, GDP per Capita, Unemployment, CPI, Inflation, Gov Spending, Gov Debt, Tax Revenue, GINI, Remittances, Labor Productivity, Agriculture/Manufacturing/Services GDP shares
- **Infrastructure** (9): Electricity Access/Generation, Primary Energy, Gas/Oil Electricity, Energy per Capita, Clean Cooking, Clean Water, Sanitation
- **Education** (9): Primary/Secondary/Tertiary Enrollment, Education Spending, Mean/Expected Years of Schooling, Primary Completion, Pupil-Teacher Ratio, Youth NEET
- **Governance** (7): Military Spending, Corruption, Democracy, Human Rights, Women in Parliament, Press Freedom, Rule of Law
- **Trade** (6): FDI, Trade Openness, Exports, Imports, Merchandise Exports/Imports

## Features
- **100 Datasets** across 9 categories covering technology, health, environment, economy, demographics, infrastructure, education, governance, and trade
- **SVG Sparkline Dashboard**: Overview page with native SVG polylines, category filter pills with counts, 5-year change percentages, progress bar
- **Global Search**: Cmd/Ctrl+K modal searching datasets + pages, keyboard-navigable
- **Favorites System**: Star button on each dataset card and in DatasetView, persisted in localStorage (`jode-favorites`)
- **URL-Persisted Filters**: `?cat=` for category filter in Datasets page, `?range=` for time filter in DatasetView
- **YoY Toggle**: Bar chart view of year-over-year % changes in DatasetView
- **Breadcrumb Navigation**: Home › Datasets › [Name] in DatasetView
- **Toast Notifications**: After CSV export, PNG download, and embed copy; managed by ToastContext
- **Back-to-Top Button**: Floating button appears after 500px scroll
- **Correlation Engine**: Pearson heatmap matrix with click-to-detail panel
- **Anomaly Detection**: Z-score analysis (threshold 1.8) with historical event context
- **Data Stories**: 9 interactive narratives (Digital Leap, Health Transformation, Environmental Crossroads, Economic Transformation, Refugee Burden, Energy Independence, Youth & Education, Water Crisis, Urbanization)
- **Scenario Modeler**: Regression-based what-if with slider (-50% to +50%)
- **Data Quality Scorecard**: Completeness (40%), freshness (35%), coverage (25%) scoring with progress bar
- **Titan Forecasting**: Holt-Linear smoothing projections to 2030
- **Country Comparison**: Jordan vs World with dual Y-axis
- **Historical Events**: Annotated chart markers (1967 War, Arab Spring, COVID-19, etc.)
- **Shareable URLs**: Time filter and category filter encoded in URL via `useSearchParams`
- **PNG/CSV Export**: Chart image and data export with toast confirmation
- **Embed Widget**: iframe code generator with clipboard toast
- **Colorblind Palette**: Accessible colors toggle
- **Compare Engine**: Multi-dataset comparison
- **Mobile Responsive**: Hamburger menu, responsive chart heights
- **Print Stylesheet**: `@media print` rules for clean printing

## Removed Datasets
- Literacy Rate (formerly ID 11) — removed due to sparse Jordan data
- Poverty Rate (formerly ID 25) — removed due to sparse Jordan data
- Tourism Arrivals (formerly ID 28) — replaced by Food Undernourishment (FAO/OWID)

## Persistence
- `jode-colorblind` — localStorage — Colorblind preference
- `jode-tour-seen` — localStorage — Onboarding tour dismissed
- `jode-theme` — localStorage — Dark/light theme
- `jode-favorites` — localStorage — Array of favorited dataset IDs
- `jode-ds-{id}` — sessionStorage — Cached dataset time series (DataService cache)
