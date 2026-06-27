import { motion } from 'framer-motion';
import { Eye, Download, Trash2 } from 'lucide-react';

const ConvertedFilesList = ({ files, onPreview, onDownload, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Output Files</h3>
      <div className="space-y-3">
        {files.map((file, index) => {
          const converted = file?.file ? file : (file instanceof Blob ? { file } : file?.[0] || file || {});
          const fileData = converted.file || converted;
          const filename = converted.filename || converted.originalName || converted.name || 'document.pdf';
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-4 rounded-2xl flex items-center justify-between gap-4 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <span className="material-icons text-sm">picture_as_pdf</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{filename}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPreview(fileData)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl glass hover:text-blue-600 transition-all text-sm font-bold"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onDownload(fileData)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl glass hover:text-green-600 transition-all text-sm font-bold"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                {onRemove && (
                  <button
                    onClick={() => onRemove(index)}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl glass hover:text-red-600 transition-all text-sm font-bold"
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