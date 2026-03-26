import Papa from 'papaparse';
import { OWID_CONFIG } from '../constants/datasets';

export interface TimePoint { year: number; value: number; }
export type TimeSeries = TimePoint[];

class DataService {
  private cache = new Map<number, TimeSeries>();
  private pending = new Map<number, Promise<TimeSeries>>();
  private activeCount = 0;
  private readonly maxConcurrent = 6;
  private queue: (() => void)[] = [];

  private processQueue() {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.activeCount++;
      task();
    }
  }

  private done(id: number, series: TimeSeries, resolve: (s: TimeSeries) => void) {
    this.cache.set(id, series);
    try { sessionStorage.setItem(`jode-ds-${id}`, JSON.stringify(series)); } catch {}
    this.pending.delete(id);
    this.activeCount--;
    this.processQueue();
    resolve(series);
  }

  fetch(id: number): Promise<TimeSeries> {
    if (this.cache.has(id)) return Promise.resolve(this.cache.get(id)!);

    const stored = sessionStorage.getItem(`jode-ds-${id}`);
    if (stored) {
      try {
        const parsed: TimeSeries = JSON.parse(stored);
        this.cache.set(id, parsed);
        return Promise.resolve(parsed);
      } catch {}
    }

    if (this.pending.has(id)) return this.pending.get(id)!;

    const promise = new Promise<TimeSeries>((resolve) => {
      const doFetch = () => {
        const config = OWID_CONFIG[String(id)];
        if (!config) { this.done(id, [], resolve); return; }

        Papa.parse(`https://ourworldindata.org/grapher/${config.slug}.csv`, {
          download: true,
          header: true,
          complete: (results) => {
            const rows = (results.data as any[]).filter(r => r['Entity'] === 'Jordan');
            const keys = rows[0] ? Object.keys(rows[0]) : [];
            const valueKey = keys.find(k => k !== 'Entity' && k !== 'Code' && k !== 'Year' && k !== '');
            const series: TimeSeries = rows
              .map(r => ({ year: parseInt(r['Year']), value: parseFloat(r[valueKey || '']) }))
              .filter(d => !isNaN(d.year) && !isNaN(d.value) && d.year >= 1960)
              .sort((a, b) => a.year - b.year);
            this.done(id, series, resolve);
          },
          error: () => this.done(id, [], resolve),
        });
      };

      if (this.activeCount < this.maxConcurrent) {
        this.activeCount++;
        doFetch();
      } else {
        this.queue.push(doFetch);
      }
    });

    this.pending.set(id, promise);
    return promise;
  }

  async fetchAll(
    ids: number[],
    onProgress?: (done: number, total: number) => void
  ): Promise<Map<number, TimeSeries>> {
    const result = new Map<number, TimeSeries>();
    let done = 0;
    await Promise.all(ids.map(async (id) => {
      const series = await this.fetch(id);
      result.set(id, series);
      onProgress?.(++done, ids.length);
    }));
    return result;
  }
}

export const dataService = new DataService();
