import { toPng } from 'html-to-image';
import { useToast } from '../context/ToastContext';

interface DownloadChartButtonProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  fileName: string;
}

export default function DownloadChartButton({ chartRef, fileName }: DownloadChartButtonProps) {
  const { showToast } = useToast();

  const handleDownload = async () => {
    if (!chartRef.current) return;

    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `JODE_${fileName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Chart saved as PNG', 'success');
    } catch (err) {
      console.error('Failed to export chart', err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm"
      title="Download chart as PNG"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
      PNG
    </button>
  );
}
