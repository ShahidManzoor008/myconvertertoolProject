import { motion } from 'framer-motion';
import { Eye, Download, Trash2 } from 'lucide-react';

const ConvertedFilesList = ({ files, onPreview, onDownload, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Output Files</h3>
      <div className="space-y-3">
        {files.map((file, index) => {
          const converted = file?.blob || file?.file ? file : (file instanceof Blob ? { blob: file } : file?.[0] || file || {});
          const filename = converted.filename || converted.originalName || converted.name || 'document.pdf';
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-4 rounded-2xl flex flex-col gap-4 border border-slate-100 dark:border-slate-800 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <span className="material-icons text-sm">picture_as_pdf</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{filename}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
                <button
                  onClick={() => onPreview(converted)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl glass hover:text-blue-600 transition-all text-xs sm:text-sm font-bold w-full"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onDownload(converted)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl glass hover:text-green-600 transition-all text-xs sm:text-sm font-bold w-full"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                {onRemove && (
                  <button
                    onClick={() => onRemove(index)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl glass hover:text-red-600 transition-all text-xs sm:text-sm font-bold w-full"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ConvertedFilesList;
