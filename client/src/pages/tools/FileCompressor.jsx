import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, Check, FileImage, FileText, LoaderCircle, RefreshCw, Upload, X } from 'lucide-react';
import { useToolWorkspace } from '../../hooks/useToolWorkspace';
import { safeStorage } from '../../utils/storage';
import SEO from '../../utils/SEO';
import ToolSupportSection from '../../components/ToolSupportSection';

const MAX_BYTES = 75 * 1024 * 1024;
const formats = {
  pdf: { 'application/pdf': ['.pdf'] },
  image: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
};
const presets = {
  pdf: [
    { value: 'light', label: 'Light', detail: 'Keep quality high' },
    { value: 'balanced', label: 'Recommended', detail: 'Balance size and clarity' },
    { value: 'strong', label: 'Strong', detail: 'Smaller file, softer images' },
  ],
  image: [
    { value: 'quality', label: 'Best quality', detail: 'Gentler compression' },
    { value: 'balanced', label: 'Balanced', detail: 'Good everyday choice' },
    { value: 'smaller', label: 'Smaller file', detail: 'More compression' },
  ],
};

const formatSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[index]}`;
};

export default function FileCompressor() {
  const workspaceRef = useToolWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'image' ? 'image' : 'pdf';
  const [mode, setMode] = useState(initialMode);
  const [file, setFile] = useState(null);
  const [preset, setPreset] = useState('balanced');
  const [format, setFormat] = useState('original');
  const [width, setWidth] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const onDrop = useCallback((accepted, rejected) => {
    setError('');
    setResult(null);
    if (rejected.length) {
      const tooLarge = rejected.some(item => item.errors.some(issue => issue.code === 'file-too-large'));
      setError(tooLarge ? 'The file must be 75 MB or smaller.' : `Choose a supported ${mode === 'pdf' ? 'PDF' : 'JPEG, PNG, or WebP image'}.`);
      return;
    }
    setFile(accepted[0] || null);
  }, [mode]);

  const dropzone = useDropzone({ accept: formats[mode], multiple: false, maxFiles: 1, maxSize: MAX_BYTES, onDrop });
  const { getRootProps, getInputProps, isDragActive, open } = dropzone;
  const currentPresets = presets[mode];
  const selectMode = (nextMode) => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
    setFile(null); setError(''); setResult(null);
    setPreset('balanced'); setFormat('original'); setWidth('');
  };

  const compress = async () => {
    if (!file || busy) return;
    setBusy(true); setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('preset', preset);
      if (mode === 'image') {
        body.append('format', format);
        if (width) body.append('width', width);
      }
      const token = safeStorage.getItem('auth_token');
      const response = await fetch(`/api/compress/${mode}`, {
        method: 'POST', body, credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Compression failed (${response.status}). Please try another file.`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const originalSize = Number(response.headers.get('X-Original-Size')) || file.size;
      const outputSize = Number(response.headers.get('X-Compressed-Size')) || blob.size;
      setResult({ blob, url, filename: response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1] || `compressed.${mode === 'pdf' ? 'pdf' : 'img'}`, originalSize, outputSize, reduced: response.headers.get('X-Compression-Reduced') === 'true', mimeType: blob.type });
    } catch (failure) {
      setError(failure.message || 'Unable to compress this file. Please try again.');
    } finally { setBusy(false); }
  };

  const clear = () => { setFile(null); setError(''); setResult(null); };
  const percentage = result && result.originalSize ? Math.max(0, Math.round((1 - result.outputSize / result.originalSize) * 100)) : 0;

  return <main ref={workspaceRef} tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 outline-none sm:px-6 sm:pt-10">
    <SEO canonicalUrl="/tools/file-compressor" />
    <header className="mx-auto mb-7 max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><RefreshCw size={14} /> Free file size reducer</span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">File Compressor</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">Reduce PDF and image file sizes with quality settings that fit your needs.</p>
    </header>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20" aria-label="File compression workspace">
      <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Choose file type">
        {[['pdf', FileText, 'Compress PDF'], ['image', FileImage, 'Compress images']].map(([value, Icon, label]) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => selectMode(value)} className={`flex min-h-14 items-center justify-center gap-2 px-3 text-sm font-bold transition sm:min-h-16 ${mode === value ? 'border-b-2 border-blue-600 bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}><Icon size={18} />{label}</button>)}
      </div>

      <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div {...getRootProps({ className: `flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:bg-slate-800'}` })}>
            <input {...getInputProps({ 'aria-label': `Choose ${mode === 'pdf' ? 'PDF' : 'image'} file` })} />
            {file ? <>
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{mode === 'pdf' ? <FileText size={24} /> : <FileImage size={24} />}</span>
              <span className="max-w-full break-all text-sm font-bold text-slate-900 dark:text-white">{file.name}</span>
              <span className="mt-1 text-xs text-slate-500">{formatSize(file.size)}</span>
            </> : <>
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300"><Upload size={23} /></span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{isDragActive ? 'Drop your file here' : 'Choose a file or drag it here'}</span>
              <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">{mode === 'pdf' ? 'PDF' : 'JPEG, PNG, or WebP'} · Up to 75 MB</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); open(); }} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Browse files</button>
            </>}
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Compression level</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {currentPresets.map(item => <button key={item.value} type="button" aria-pressed={preset === item.value} onClick={() => setPreset(item.value)} className={`rounded-xl border p-3 text-left transition ${preset === item.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/15 dark:bg-blue-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
                <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900 dark:text-white">{item.label}{preset === item.value && <Check size={15} className="text-blue-600" />}</span>
                <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.detail}</span>
              </button>)}
            </div>
          </fieldset>
        </div>

        <aside className="flex flex-col rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Options</h2>
          {mode === 'image' ? <div className="mt-4 space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Output format
              <select value={format} onChange={event => setFormat(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                <option value="original">Keep original format</option><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Resize width (optional)
              <div className="relative mt-1.5"><input type="number" min="100" max="8000" step="1" value={width} onChange={event => setWidth(event.target.value)} placeholder="Keep original dimensions" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-14 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><span className="absolute right-3 top-3 text-xs text-slate-400">pixels</span></div>
              <span className="mt-1 block font-normal leading-5 text-slate-500">Aspect ratio is preserved. Images are never enlarged.</span>
            </label>
          </div> : <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">PDF compression optimizes embedded images and document structure. Text and vector content are preserved where possible; strong compression can soften image details.</p>}

          <div className="mt-auto pt-6">
            {error && <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            {result && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30" role="status">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300"><Check size={17} />{result.reduced ? `Reduced by ${percentage}%` : 'File is ready'}</div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300"><span>{formatSize(result.originalSize)} <span aria-hidden="true">→</span> {formatSize(result.outputSize)}</span><span>{result.reduced ? `${formatSize(result.originalSize - result.outputSize)} saved` : 'No size reduction for these settings'}</span></div>
              <a href={result.url} download={result.filename} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"><ArrowDownToLine size={17} />Download compressed file</a>
            </div>}
            <button type="button" onClick={compress} disabled={!file || busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
              {busy ? <><LoaderCircle size={18} className="animate-spin" />Compressing file…</> : <><RefreshCw size={17} />{result ? 'Compress again' : `Compress ${mode === 'pdf' ? 'PDF' : 'image'}`}</>}
            </button>
            {(file || result) && <button type="button" onClick={clear} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"><X size={15} />Clear and choose another file</button>}
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Processing is automatic. Some already-optimized files may not get smaller.</p>
          </div>
        </aside>
      </div>
    </section>
    <section className="mx-auto mt-8 grid max-w-4xl gap-3 text-center sm:grid-cols-3">
      {[['1', 'Choose PDF or image'], ['2', 'Select a compression level'], ['3', 'Review and download']].map(([n, label]) => <div key={n} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{n}</span><p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p></div>)}
    </section>
    <ToolSupportSection currentPath="/tools/file-compressor" category="PDF Tools" />
  </main>;
}
