# Jordan Data Explorer (JODE)

Jordan Data Explorer is an open-source web app for exploring Jordan-focused macroeconomic, demographic, technology, infrastructure, and environmental indicators.

It combines historical data from global providers with local proxy datasets where useful, then visualizes trends with forward projections to 2027.

## Why This Project Exists

Public data is often fragmented across sources, formats, and update cycles. JODE provides:

- A single, lightning-fast interface for 24 key Jordan indicators.
- Consistent charting and comparison views.
- Transparent methodology for projections, source blending, and structural breaks.
- A sophisticated, minimalist "Swiss-Data" aesthetic with system-wide Dark Mode.

## Core Features

- **Interactive Data Catalog:** 24 curated macroeconomic and demographic indicators.
- **High-Performance Architecture:** Utilizes `sessionStorage` caching, `useMemo` computation caching, and route-based code splitting for zero-latency chart rendering.
- **Resilient Data Pipeline:** Live CSV ingestion from Our World in Data (OWID) using PapaParse, with graceful error handling and fallback UI for missing or blocked upstream data.
- **Projection Engine:** Forward estimates to 2027 using Ordinary Least Squares (OLS) linear regression, featuring asymptotic bounding (capped at 100% for percentage-based metrics).
- **Responsive UI:** Built with React 19, Tailwind CSS V4, and Recharts.

## Included Datasets (24)

1. Internet Penetration
2. Life Expectancy
3. CO₂ Emissions
4. Population Growth
5. GDP per Capita
6. Electricity Access
7. Fertility Rate
8. Urban Population Share
9. Renewable Electricity
10. Child Mortality
11. Literacy Rate
12. Mobile Subscriptions
13. Water Scarcity
14. Unemployment Rate
15. Consumer Price Index (CPI)
16. Human Development Index (HDI)
17. Infant Mortality
18. Government Spending
19. Out-of-Pocket Health Expenditure
20. Female Labor Force Participation
21. Daily Protein Supply
22. Remittances to GDP
23. Electricity Generation
24. Agricultural Land Area

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router (with `lazy` and `Suspense`)
- **Charts:** Recharts
- **Data Parsing:** PapaParse
- **Styling:** Tailwind CSS V4
- **State Management:** React Context API (Theming)

## Getting Started

### 1) Clone

git clone https://github.com/i-love-c00kies/jordan-data-explorer.git
cd jordan-data-explorer

### 2) Install dependencies

npm install

### 3) Run locally

npm run dev

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Project Structure

src/
  components/
    Navbar.tsx        # Global top navigation & branding
    Footer.tsx        # Global footer with extensive source attribution
    ThemeToggle.tsx   # Extracted SVG Light/Dark mode toggle
  context/
    ThemeContext.tsx  # localStorage theme persistence engine
  pages/
    Home.tsx          # Hero page and methodology
    Datasets.tsx      # Interactive catalog and filters
    DatasetView.tsx   # Master data engine, OLS math, and charts
  App.tsx             # Routing & Global Layout

## Data and Methodology

### The Pipeline
1. Check `sessionStorage` for previously parsed and calculated data.
2. If empty, fetch indicator CSV from OWID grapher endpoints.
3. Filter to rows where `Entity === "Jordan"`.
4. Normalize values, apply dataset-specific shaping rules, and execute OLS projections.
5. Save the final calculated dataset to the browser cache.
6. Render in a multi-line chart with responsive controls.

### Projections & Bounding
Forward estimates to 2027 are generated with an Ordinary Least Squares (OLS) linear regression model using a 10-year trailing historical window. To reflect real-world constraints, the engine enforces an **asymptotic bound**—preventing negative values and capping percentage-based metrics exactly at 100% (unless explicitly uncapped, such as Water Scarcity). Projections are directional signals, not official forecasts.

## Data Source References

This project aggregates data from the following global institutions (via Our World in Data):
- World Bank Open Data
- United Nations (UN) & UNIGME
- International Monetary Fund (IMF)
- World Health Organization (WHO)
- International Labour Organization (ILO)
- Food and Agriculture Organization (FAO)
- Ember Climate
- International Telecommunication Union (ITU)
- Telecom Regulatory Commission - Jordan (TRC)

## License and Attribution

Code is open source under the repository's license terms. Data remains subject to each upstream provider's specific open-data license and usage policies.