import { useState } from 'react';
import { useToast } from '../context/ToastContext';

export default function EmbedButton({ datasetId }: { datasetId: string }) {
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();
  const embedUrl = `${window.location.origin}/datasets/${datasetId}`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="500" style="border:none;border-radius:12px;" title="JODE Chart"></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setShowModal(false);
    showToast('Embed code copied to clipboard', 'success');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm"
        title="Get embed code"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        Embed
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Embed This Chart</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Copy the code below and paste it into your website or blog.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4 overflow-x-auto">
              <code className="text-xs text-slate-700 dark:text-slate-300 break-all font-mono">{embedCode}</code>
            </div>
            <button
              onClick={copyToClipboard}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
