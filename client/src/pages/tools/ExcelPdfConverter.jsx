import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, CheckCircle2, Download, FileSpreadsheet, FileUp, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import SEO from '../../utils/SEO';
import { useToolWorkspace } from '../../hooks/useToolWorkspace';
import { apiClient } from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/apiEndpoints';
import { downloadFile } from '../../utils/fileDownloadUtils';
import ConversionProgressBar from '../../components/common/ConversionProgressBar';

const MAX_SIZE = 20 * 1024 * 1024;
const fieldClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export default function ExcelPdfConverter() {
  const workspaceRef = useToolWorkspace();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode') === 'pdf-to-excel' ? 'pdf-to-excel' : 'excel-to-pdf';
  const [mode, setMode] = useState(requestedMode);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedTable, setSelectedTable] = useState(0);
  const [orientation, setOrientation] = useState('landscape');
  const [paperSize, setPaperSize] = useState('A4');
  const [fitToWidth, setFitToWidth] = useState(true);
  const [tableMode, setTableMode] = useState('lines');
  const requestRef = useRef(null);
  const toPdf = mode === 'excel-to-pdf';

  useEffect(() => () => requestRef.current?.abort(), []);

  const clearResult = () => { setResult(null); setSelectedTable(0); setError(''); };
  const changeMode = next => {
    if (busy) return;
    setMode(next); setFile(null); clearResult();
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false, maxSize: MAX_SIZE, disabled: busy,
    accept: toPdf ? {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    } : { 'application/pdf': ['.pdf'] },
    onDropAccepted: files => { setFile(files[0]); clearResult(); },
    onDropRejected: rejections => {
      clearResult(); setFile(null);
      setError(rejections.some(r => r.errors.some(e => e.code === 'file-too-large'))
        ? 'Choose a file smaller than 20 MB.' : `Choose one ${toPdf ? '.xlsx or .xls' : '.pdf'} file.`);
    },
  });

  const convert = async event => {
    event.preventDefault();
    if (!file || busy) return;
    clearResult(); setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 165000);
    try {
      const data = new FormData();
      data.append('file', file);
      if (toPdf) {
        data.append('orientation', orientation); data.append('paperSize', paperSize);
        data.append('fitToWidth', String(fitToWidth));
      } else data.append('tableMode', tableMode);
      const response = await apiClient.upload(toPdf ? API_ENDPOINTS.spreadsheet.toPdf : API_ENDPOINTS.spreadsheet.toExcel,
        data, { signal: controller.signal });
      const blob = new Blob([Uint8Array.from(atob(response.base64), c => c.charCodeAt(0))], { type: response.mimeType });
      setResult({ ...response, base64: undefined, blob });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message || 'Conversion failed. Please try again.');
      else setError('The request timed out. Try a smaller document.');
    } finally {
      window.clearTimeout(timeout); setBusy(false); requestRef.current = null;
    }
  };
  const table = result?.preview?.[selectedTable];

  return <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:pt-12">
    <SEO />
    <header className="mb-8 max-w-3xl">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"><FileSpreadsheet size={18} /> Spreadsheet tools</p>
      <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Excel <span className="text-emerald-600">↔</span> PDF converter</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">Make spreadsheets ready to share, or bring PDF tables back into Excel.</p>
    </header>
    <section id="tool-workspace" ref={workspaceRef} tabIndex={-1} aria-label="Excel and PDF conversion workspace" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 outline-none dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Conversion direction">
        {[['excel-to-pdf', 'Excel to PDF'], ['pdf-to-excel', 'PDF to Excel']].map(([value, label]) => <button key={value} type="button" disabled={busy} aria-pressed={mode === value} onClick={() => changeMode(value)} className={`rounded-2xl px-3 py-4 font-bold transition disabled:opacity-60 ${mode === value ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300' : 'text-slate-600 hover:text-emerald-700 dark:text-slate-400'}`}>{label}</button>)}
      </div>
      <form onSubmit={convert} className="grid gap-8 p-5 md:p-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div {...getRootProps()} className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition focus-visible:outline-2 focus-visible:outline-emerald-600 ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-slate-300 bg-slate-50 hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900/50'} ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <input {...getInputProps({ 'aria-label': toPdf ? 'Upload Excel workbook' : 'Upload PDF document' })} />
            <span className="mb-4 rounded-2xl bg-emerald-100 p-4 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"><FileUp size={30} /></span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{isDragActive ? 'Drop your file here' : `Drop your ${toPdf ? 'Excel workbook' : 'PDF'} here`}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">or click to choose a file</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">{toPdf ? 'XLSX or XLS' : 'PDF with selectable text'} · Up to 20 MB</p>
          </div>
          {file && <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <FileSpreadsheet className="shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900 dark:text-white">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
            <button type="button" disabled={busy} aria-label="Remove file" onClick={() => { setFile(null); clearResult(); }} className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800"><X size={18} /></button>
          </div>}
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{toPdf ? 'Set up your PDF' : 'Find your tables'}</h2>
          <fieldset disabled={busy} className="mt-5 space-y-4 disabled:opacity-60">
            {toPdf ? <>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Page orientation<select value={orientation} onChange={e => { setOrientation(e.target.value); clearResult(); }} className={fieldClass}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Paper size<select value={paperSize} onChange={e => { setPaperSize(e.target.value); clearResult(); }} className={fieldClass}><option>A4</option><option>Letter</option></select></label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={fitToWidth} onChange={e => { setFitToWidth(e.target.checked); clearResult(); }} className="h-4 w-4 accent-emerald-600" />Fit all columns to page width</label>
            </> : <>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Table detection<select value={tableMode} onChange={e => { setTableMode(e.target.value); clearResult(); }} className={fieldClass}><option value="lines">Tables with borders</option><option value="text">Borderless tables (aligned text)</option></select></label>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Each detected table becomes a worksheet. Review the preview before downloading. Scanned PDFs need OCR first.</p>
            </>}
          </fieldset>
          <button type="submit" disabled={!file || busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><ArrowRightLeft size={18} />{busy ? 'Converting…' : `Convert to ${toPdf ? 'PDF' : 'Excel'}`}</button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-500">{toPdf ? 'All visible sheets · Existing print areas respected' : 'Up to 50 pages · Export as .xlsx'}</p>
        </div>
      </form>
      {busy && <div className="px-5 pb-6 md:px-8"><ConversionProgressBar message="Converting your document…" /></div>}
      {error && <p role="alert" className="mx-5 mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 md:mx-8">{error}</p>}
      {result && <div className="border-t border-slate-200 p-5 dark:border-slate-800 md:p-8" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white"><CheckCircle2 className="text-emerald-600" />Your {toPdf ? 'PDF' : 'workbook'} is ready</h2><button type="button" onClick={() => downloadFile(result.blob, result.filename)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"><Download size={18} />Download {toPdf ? 'PDF' : 'Excel'}</button></div>
        {result.warnings?.map(warning => <p key={warning} className="mt-3 text-sm text-slate-600 dark:text-slate-400">{warning}</p>)}
        {table && <div className="mt-6">
          <label className="block max-w-sm text-sm font-semibold text-slate-700 dark:text-slate-300">Table preview<select className={fieldClass} value={selectedTable} onChange={e => setSelectedTable(Number(e.target.value))}>{result.preview.map((entry, index) => <option key={entry.name} value={index}>{entry.name} ({entry.rows} rows × {entry.columns} columns)</option>)}</select></label>
          <p className="my-3 text-xs text-slate-500">Showing up to 8 rows and 12 columns. The download includes all extracted rows and columns.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full text-left text-sm"><caption className="sr-only">{table.name}</caption><tbody>{table.sample.map((row, index) => <tr key={index} className={index === 0 ? 'bg-emerald-50 font-bold dark:bg-emerald-950/40' : 'border-t border-slate-200 dark:border-slate-800'}>{row.map((cell, col) => <td key={col} className="max-w-xs whitespace-pre-wrap px-4 py-3 text-slate-800 dark:text-slate-200">{cell ?? ''}</td>)}</tr>)}</tbody></table></div>
        </div>}
      </div>}
    </section>
    <div className="mt-8 grid gap-5 text-sm leading-6 text-slate-600 dark:text-slate-400 md:grid-cols-3">
      <div><h2 className="mb-2 font-bold text-slate-900 dark:text-white">Share your spreadsheet</h2><p>Choose landscape for wide sheets and fit columns to the page. Workbook formulas are rendered as their calculated values.</p></div>
      <div><h2 className="mb-2 font-bold text-slate-900 dark:text-white">Recover table data</h2><p>Extract editable cells from text-based PDFs. Original formulas and exact formatting cannot be recovered from a PDF.</p></div>
      <div><h2 className="mb-2 font-bold text-slate-900 dark:text-white">Temporary processing</h2><p>Uploaded files and conversion files are removed after processing. Download your result before leaving this page.</p></div>
    </div>
  </div>;
}
