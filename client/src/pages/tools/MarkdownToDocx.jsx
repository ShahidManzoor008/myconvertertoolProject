import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Download, FileCode, CheckCircle2 } from 'lucide-react';
import SEO from '../../utils/SEO';
import ToolSupportSection from '../../components/ToolSupportSection';
import { mdToDocxApi } from '../../utils/apiClient';
import { AppError } from '../../utils/AppError';
import ConversionProgressBar from '../../components/common/ConversionProgressBar';

const MarkdownToDocx = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

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
        showPopup(`File selected: ${acceptedFiles[0].name}`);
      }
    },
  });

  const handleClearSelection = () => {
    setUploadedFile(null);
    setConvertedFile(null);
    showPopup("Workspace cleared");
  };

  const handleConvert = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const response = await mdToDocxApi.convert(formData, { responseType: 'blob' });

      const url = URL.createObjectURL(response);
      setConvertedFile({
        name: `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.docx`,
        url: url,
      });

      showPopup('Conversion successful!');
    } catch (err) {
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
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-6">
          <span className="material-icons text-xs">article</span>
          Document Production
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          MD <span className="text-indigo-600">to DOCX</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Transform your technical documentation into polished Microsoft Word documents with zero formatting loss.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-1 overflow-hidden"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-10 shadow-inner">
            {!convertedFile ? (
              <div className="space-y-10">
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

                {/* Action */}
                <div className="text-center">
                  <button
                    onClick={handleConvert}
                    disabled={!uploadedFile || loading}
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

            {loading && (
              <div className="mt-10">
                <ConversionProgressBar message="Executing complex formatting logic..." />
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
