/**
 * JODE "Titan" Projection Engine v4.1
 * Upgraded: Added Step 0 to automatically interpolate missing years.
 * Fixed: Division by Zero guards for datasets that start at 0 (like Internet).
 */

export interface DataPoint {
    year: number;
    value: number;
  }
  
  export const calculateAdvancedProjection = (
    history: DataPoint[],
    targetYear: number = 2030,
    isPercentage: boolean = false
  ) => {
    if (history.length < 2) return [];
  
    // 0. DATA GAP INTERPOLATION
    // Fills in missing chronological years with a straight line so the math doesn't skip a beat.
    const sortedHistory = [...history].sort((a, b) => a.year - b.year);
    const denseHistory: DataPoint[] = [];
  
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const current = sortedHistory[i];
      const next = sortedHistory[i + 1];
      
      denseHistory.push(current);
  
      const yearGap = next.year - current.year;
      if (yearGap > 1) {
        const valueStep = (next.value - current.value) / yearGap;
        for (let step = 1; step < yearGap; step++) {
          denseHistory.push({
            year: current.year + step,
            value: current.value + (valueStep * step)
          });
        }
      }
    }
    denseHistory.push(sortedHistory[sortedHistory.length - 1]);
  
    if (denseHistory.length < 5) return [];
  
    // 1. DATA CLEANING: Moving median to ignore "shocks"
    const cleanedHistory = denseHistory.map((pt, i) => {
      if (i === 0 || i === denseHistory.length - 1) return pt.value;
      const neighborhood = [denseHistory[i - 1].value, pt.value, denseHistory[i + 1].value].sort((a, b) => a - b);
      return neighborhood[1]; 
    });
  
    // 2. REGIME DETECTION & ZERO-GUARDS
    const lastValue = cleanedHistory[cleanedHistory.length - 1];
    
    // FIX: Prevent Division by Zero if the dataset starts at exactly 0
    const firstValue = cleanedHistory[0] === 0 ? 0.001 : cleanedHistory[0];
    const totalYears = Math.max(1, denseHistory[denseHistory.length - 1].year - denseHistory[0].year);
    
    // CAGR for long-term velocity (Protected against negative/zero errors)
    let cagr = 1.02; // Default to 2% stable growth if math fails
    if (lastValue > 0 && firstValue > 0) {
      cagr = Math.pow(lastValue / firstValue, 1 / totalYears);
    }
    
    const isSaturating = isPercentage && lastValue > 70; 
    const useMultiplicative = !isPercentage && lastValue > 100;
  
    // 3. TREND INITIALIZATION
    const shortTermPoints = cleanedHistory.slice(-5);
    const shortTermTrend = (shortTermPoints[shortTermPoints.length - 1] - shortTermPoints[0]) / 4; 
    
    // FIX: Protect the previous year value from Division by Zero
    const prevValue = cleanedHistory[cleanedHistory.length - 2] === 0 ? 0.001 : cleanedHistory[cleanedHistory.length - 2];
  
    let currentTrend = useMultiplicative 
      ? (0.6 * (lastValue / prevValue) + 0.4 * cagr)
      : (shortTermTrend);
  
    const projections = [];
    let currentLevel = lastValue;
    let yearIter = denseHistory[denseHistory.length - 1].year;
  
    // 4. THE FORECAST LOOP
    while (yearIter < targetYear) {
      yearIter++;
  
      if (isSaturating) {
        // LOGISTIC: Growth slows as it hits 100%
        const gapToCeiling = 100 - currentLevel;
        const saturationSpeed = 0.15; 
        currentLevel += gapToCeiling * saturationSpeed;
      } 
      else if (useMultiplicative) {
        // MULTIPLICATIVE: For GDP/Currency/Population
        const dampening = 0.96; 
        currentTrend = 1 + (currentTrend - 1) * dampening;
        currentLevel *= currentTrend;
      } 
      else {
        // LINEAR: Standard indicators
        const dampening = 0.85;
        currentTrend *= dampening;
        currentLevel += currentTrend;
      }
  
      // 5. PRECISION & BOUNDS
      // Fallback in case of a rogue NaN
      if (isNaN(currentLevel)) currentLevel = lastValue;
  
      const displayPrecision = currentLevel < 1 ? 10000 : 100;
      let finalVal = Math.round(currentLevel * displayPrecision) / displayPrecision;
  
      if (finalVal < 0) finalVal = 0;
      if (isPercentage && finalVal > 100) finalVal = 100;
  
      projections.push({ year: yearIter, value: finalVal });
    }
  
    return projections;
  };

export interface HoltLinearResult {
  fitted: { year: number; value: number }[];
  forecast: { year: number; value: number }[];
  level: number;
  trend: number;
}

export function holtLinear(
  data: { year: number; value: number }[],
  alpha: number,
  beta: number,
  forecastTo: number = 2030
): HoltLinearResult {
  if (data.length < 2) return { fitted: [], forecast: [], level: 0, trend: 0 };

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const n = sorted.length;

  let L = sorted[0].value;
  let T = sorted[1].value - sorted[0].value;

  const fitted: { year: number; value: number }[] = [{ year: sorted[0].year, value: L + T }];

  for (let i = 1; i < n; i++) {
    const v = sorted[i].value;
    const prevL = L;
    L = alpha * v + (1 - alpha) * (prevL + T);
    T = beta * (L - prevL) + (1 - beta) * T;
    fitted.push({ year: sorted[i].year, value: L + T });
  }

  const lastYear = sorted[n - 1].year;
  const steps = forecastTo - lastYear;
  const forecast: { year: number; value: number }[] = [];

  for (let m = 1; m <= steps; m++) {
    forecast.push({ year: lastYear + m, value: L + m * T });
  }

  return { fitted, forecast, level: L, trend: T };
}

export interface ProjectionPreset {
  label: string;
  alpha: number;
  beta: number;
  color: string;
  dashArray: string;
  description: string;
}

export const PROJECTION_PRESETS: ProjectionPreset[] = [
  { label: 'Pessimistic', alpha: 0.15, beta: 0.05, color: '#ef4444', dashArray: '4 3', description: 'Slow adaptation, minimal trend weighting' },
  { label: 'Baseline',    alpha: 0.45, beta: 0.20, color: '#64748b', dashArray: '4 3', description: 'Balanced smoothing — standard assumption' },
  { label: 'Optimistic',  alpha: 0.80, beta: 0.50, color: '#10b981', dashArray: '4 3', description: 'Reactive to recent data, strong trend extrapolation' },
];