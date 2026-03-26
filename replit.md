# Jordan Data Explorer (JODE)

## Overview
An open-source web application for exploring macroeconomic, demographic, and environmental indicators for Jordan. Aggregates data from World Bank, UN, WHO, and other providers. Features the "Titan" Projection Engine for historical gap-filling and forward-looking projections.

## Tech Stack
- **Frontend:** React 19 + TypeScript
- **Build System:** Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router 7
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **Search:** Fuse.js
- **Package Manager:** npm

## Project Structure
- `src/components/` — Reusable UI components (Navbar, Footer, ThemeToggle, ExportButton)
- `src/pages/` — Route-level views (Home, Datasets, DatasetView, CompareView)
- `src/constants/datasets.ts` — Metadata/config for all 24 supported indicators
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
- Data is fetched as CSVs from Our World in Data, cached in `sessionStorage`
