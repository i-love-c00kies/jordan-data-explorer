export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const xs = x.slice(0, n);
  const ys = y.slice(0, n);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const xs = x.slice(0, n);
  const ys = y.slice(0, n);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - meanX) * (ys[i] - meanY);
    ssXX += (xs[i] - meanX) * (xs[i] - meanX);
    ssTot += (ys[i] - meanY) * (ys[i] - meanY);
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (ys[i] - predicted) * (ys[i] - predicted);
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export interface Anomaly {
  year: number;
  value: number;
  zScore: number;
  direction: 'spike' | 'drop';
  magnitude: 'moderate' | 'severe' | 'extreme';
  percentChange: number;
}

export function detectAnomalies(
  data: { year: number; value: number }[],
  threshold: number = 1.8
): Anomaly[] {
  if (data.length < 5) return [];

  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

  if (std === 0) return [];

  const anomalies: Anomaly[] = [];

  for (let i = 1; i < data.length; i++) {
    const zScore = (data[i].value - mean) / std;
    const absZ = Math.abs(zScore);

    if (absZ >= threshold) {
      const prevVal = data[i - 1].value;
      const percentChange = prevVal !== 0
        ? ((data[i].value - prevVal) / Math.abs(prevVal)) * 100
        : 0;

      anomalies.push({
        year: data[i].year,
        value: data[i].value,
        zScore,
        direction: zScore > 0 ? 'spike' : 'drop',
        magnitude: absZ >= 3 ? 'extreme' : absZ >= 2.5 ? 'severe' : 'moderate',
        percentChange,
      });
    }
  }

  return anomalies;
}

export interface DataQualityScore {
  completeness: number;
  freshness: number;
  coverage: number;
  overall: number;
  totalYears: number;
  missingYears: number;
  latestYear: number;
  earliestYear: number;
  gaps: number[];
}

export function assessDataQuality(
  data: { year: number; value: number }[],
  expectedStart: number = 1960,
  currentYear: number = 2024
): DataQualityScore {
  if (data.length === 0) {
    return { completeness: 0, freshness: 0, coverage: 0, overall: 0, totalYears: 0, missingYears: 0, latestYear: 0, earliestYear: 0, gaps: [] };
  }

  const years = data.map(d => d.year).sort((a, b) => a - b);
  const earliest = years[0];
  const latest = years[years.length - 1];

  const expectedYears = latest - Math.max(earliest, expectedStart) + 1;
  const actualYears = new Set(years).size;
  const completeness = expectedYears > 0 ? Math.min(1, actualYears / expectedYears) : 0;

  const yearsSinceLatest = currentYear - latest;
  const freshness = yearsSinceLatest <= 1 ? 1 : yearsSinceLatest <= 3 ? 0.8 : yearsSinceLatest <= 5 ? 0.6 : yearsSinceLatest <= 10 ? 0.3 : 0.1;

  const totalSpan = currentYear - expectedStart;
  const coverage = totalSpan > 0 ? Math.min(1, (latest - earliest) / totalSpan) : 0;

  const gaps: number[] = [];
  for (let y = earliest; y <= latest; y++) {
    if (!years.includes(y)) gaps.push(y);
  }

  const overall = completeness * 0.4 + freshness * 0.35 + coverage * 0.25;

  return {
    completeness: Math.round(completeness * 100),
    freshness: Math.round(freshness * 100),
    coverage: Math.round(coverage * 100),
    overall: Math.round(overall * 100),
    totalYears: actualYears,
    missingYears: gaps.length,
    latestYear: latest,
    earliestYear: earliest,
    gaps,
  };
}
