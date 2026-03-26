export interface HistoricalEvent {
  year: number;
  label: string;
  description: string;
  color: string;
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  { year: 1967, label: '1967 War', description: 'Six-Day War and influx of displaced Palestinians', color: '#ef4444' },
  { year: 1989, label: '1989 Reforms', description: 'Political liberalization and first parliamentary elections since 1967', color: '#3b82f6' },
  { year: 1994, label: '1994 Peace Treaty', description: 'Jordan-Israel Peace Treaty signed', color: '#10b981' },
  { year: 1999, label: 'King Abdullah II', description: 'King Abdullah II ascends to the throne', color: '#8b5cf6' },
  { year: 2003, label: 'Iraq War', description: 'Iraq War triggers refugee influx into Jordan', color: '#ef4444' },
  { year: 2008, label: '2008 Crisis', description: 'Global financial crisis impacts Jordan\'s economy', color: '#f59e0b' },
  { year: 2011, label: 'Arab Spring', description: 'Regional Arab Spring protests reach Jordan', color: '#ef4444' },
  { year: 2014, label: 'Syrian Crisis', description: 'Peak of Syrian refugee influx into Jordan', color: '#f97316' },
  { year: 2020, label: 'COVID-19', description: 'COVID-19 pandemic and nationwide lockdowns', color: '#ef4444' },
  { year: 2022, label: 'IMF Program', description: 'IMF Extended Fund Facility agreement', color: '#0ea5e9' },
];
