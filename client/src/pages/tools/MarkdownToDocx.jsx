import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Download, FileCode, CheckCircle2, Clipboard, Eraser, Keyboard } from 'lucide-react';
import SEO from '../../utils/SEO';
import ToolSupportSection from '../../components/ToolSupportSection';
import { mdToDocxApi } from '../../utils/apiClient';
import { AppError } from '../../utils/AppError';
import ConversionProgressBar from '../../components/common/ConversionProgressBar';
import { useConversionProgress } from '../../hooks/useConversionProgress';

const MarkdownToDocx = () => {
  const [inputMode, setInputMode] = useState('paste');
  const [markdownText, setMarkdownText] = useState('');
  const [textFilename, setTextFilename] = useState('markdown-document');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const conversionProgress = useConversionProgress();

  const textStats = useMemo(() => {
    const trimmed = markdownText.trim();
    return {
      characters: markdownText.length,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      headings: (markdownText.match(/^#{1,6}\s+/gm) || []).length,
      tables: (markdownText.match(/^\s*\|.+\|\s*$/gm) || []).length,
      equations: (markdownText.match(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\n$]+\$|\\\([\s\S]+?\\\)/g) || []).length,
    };
  }, [markdownText]);

  const canConvert = inputMode === 'paste' ? markdownText.trim().length > 0 : Boolean(uploadedFile);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'text/markdown': ['.md', '.markdown'] },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(`Invalid file type. Please upload a .md file.`);
      }
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setConvertedFile(null);
        setInputMode('upload');
        showPopup(`File selected: ${acceptedFiles[0].name}`);
      }
    },
  });

  const handleClearSelection = () => {
    setMarkdownText('');
    setUploadedFile(null);
    setConvertedFile(null);
    showPopup("Workspace cleared");
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
    setConvertedFile(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        showPopup('Clipboard is empty');
        return;
      }
      setMarkdownText(clipboardText);
      setInputMode('paste');
      setConvertedFile(null);
      showPopup('Markdown pasted');
    } catch {
      showPopup('Clipboard access blocked. Paste manually.');
    }
  };

  const handleConvert = async () => {
    if (!canConvert) return;

    setLoading(true);
    conversionProgress.start();
    try {
      let response;
      let outputName;

      if (inputMode === 'paste') {
        const safeBaseName = textFilename.trim() || 'markdown-document';
        response = await mdToDocxApi.convertText({
          markdown: markdownText,
          filename: safeBaseName,
        });
        outputName = `${safeBaseName.replace(/\.[^/.]+$/, '')}.docx`;
      } else {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        response = await mdToDocxApi.convert(formData, { responseType: 'blob' });
        outputName = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.docx`;
      }

      const url = URL.createObjectURL(response);
      setConvertedFile({
        name: outputName,
        url: url,
      });

      conversionProgress.complete('DOCX ready for download');
      showPopup('Conversion successful!');
    } catch (err) {
      conversionProgress.fail('Conversion failed');
      showPopup(err instanceof AppError ? err.message : 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <SEO
        title={'Free Markdown to DOCX Converter Pro | Word Document Generator'}
        description={'Convert your Markdown (.md) files to professional Microsoft Word (.docx) documents instantly for free.'}
        keywords={'markdown to docx, md to word, convert markdown, md converter pro'}
        canonicalUrl={'/tools/markdown-to-docx'}
        ogType={'website'}
      />

      {/* Header */}
      <section className="text-center py-12 md:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-6">
          <span className="material-icons text-xs">article</span>
          Document Production
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          MD <span className="text-indigo-600">to DOCX</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Paste Markdown text or upload a file, then generate a polished Word document with tables, code blocks, and math equation support.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
            {!convertedFile ? (
              <div className="space-y-8">
                <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950">
                  {[
                    { key: 'paste', label: 'Paste Markdown', icon: Keyboard },
                    { key: 'upload', label: 'Upload File', icon: Upload },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleModeChange(key)}
                      className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all ${
                        inputMode === key
                          ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {inputMode === 'paste' ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Output filename
                        </span>
                        <input
                          value={textFilename}
                          onChange={(event) => setTextFilename(event.target.value)}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          placeholder="markdown-document"
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <span className="flex items-center gap-2"><Clipboard size={16} /> Paste</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarkdownText('')}
                          className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-black text-red-500 transition hover:bg-red-50 dark:border-slate-800 dark:hover:bg-red-950/30"
                        >
                          <span className="flex items-center gap-2"><Eraser size={16} /> Clear</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={markdownText}
                      onChange={(event) => {
                        setMarkdownText(event.target.value);
                        setConvertedFile(null);
                      }}
                      className="min-h-[360px] w-full resize-y rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
                      spellCheck="false"
                      placeholder={`# Project Notes\n\nPaste copied Markdown here.\n\n| Feature | Status |\n| --- | --- |\n| Tables | Supported |\n| Math | $E = mc^2$ |\n\n$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$`}
                    />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        ['Words', textStats.words],
                        ['Characters', textStats.characters],
                        ['Headings', textStats.headings],
                        ['Table rows', textStats.tables],
                        ['Equations', textStats.equations],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                          <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Dropzone */}
                    <motion.div
                      {...getRootProps()}
                      whileHover={{ y: -2 }}
                      className={`group relative border-2 border-dashed p-16 text-center cursor-pointer rounded-[2.5rem] transition-all duration-300 ${
                        isDragActive
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {isDragActive ? 'Release to upload' : 'Drop Markdown file'}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Supports .md and .markdown formats
                      </p>
                    </motion.div>

                    {/* Selected File State */}
                    <AnimatePresence>
                      {uploadedFile && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600 flex-shrink-0">
                              <FileCode size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{uploadedFile.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(uploadedFile.size / 1024).toFixed(1)} KB • Ready for conversion</p>
                            </div>
                          </div>
                          <button onClick={handleClearSelection} className="p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors flex-shrink-0">
                            <X size={20} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Action */}
                <div className="text-center">
                  <button
                    onClick={handleConvert}
                    disabled={!canConvert || loading}
                    className="btn-primary w-full sm:w-auto px-12 py-5 text-lg shadow-indigo-500/25"
                  >
                    <FileText size={20} />
                    {loading ? 'Processing...' : 'Generate Word Document'}
                  </button>
                </div>
              </div>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 size={48} className="animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">Success!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 uppercase tracking-widest text-xs">Your document is ready for download</p>

                <div className="max-w-md mx-auto p-6 rounded-[2rem] glass border-none mb-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <span className="material-icons">description</span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{convertedFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Microsoft Word Document</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={convertedFile.url}
                    download={convertedFile.name}
                    className="btn-primary w-full sm:w-auto px-12 py-5 text-lg !bg-blue-600 shadow-blue-500/25"
                  >
                    <Download size={20} />
                    Download File
                  </a>
                  <button
                    onClick={handleClearSelection}
                    className="px-10 py-5 rounded-2xl font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full sm:w-auto uppercase tracking-widest text-xs"
                  >
                    New Conversion
                  </button>
                </div>
              </motion.div>
            )}

            {conversionProgress.active && (
              <div className="mt-10">
                <ConversionProgressBar
                  message={conversionProgress.message}
                  progress={conversionProgress.progress}
                  status={conversionProgress.status}
                  events={[
                    { label: 'Preparing input', active: conversionProgress.progress >= 12 },
                    { label: 'Uploading Markdown', active: conversionProgress.progress >= 34 },
                    { label: 'Rendering tables and math', active: conversionProgress.progress >= 62 },
                    { label: 'Creating DOCX', active: conversionProgress.progress >= 86 },
                  ]}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <ToolSupportSection currentPath="/tools/markdown-to-docx" category="Text Tools" />
      </div>

      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">{popupMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarkdownToDocx;
