import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, FileText, Download } from 'lucide-react';
import SEO from '../../utils/SEO';
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
        setConvertedFile(null); // Clear previous conversion
        showPopup(`File selected: ${acceptedFiles[0].name}`);
      }
    },
  });

  const handleClearSelection = () => {
    setUploadedFile(null);
    setConvertedFile(null);
    showPopup("Selection cleared");
  };

  const handleConvert = async () => {
    if (!uploadedFile) {
      return showPopup('No Markdown file selected!');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const response = await mdToDocxApi.convert(formData);

      const blob = response;
      const url = URL.createObjectURL(blob);
      
      setConvertedFile({
        name: `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.docx`,
        url: url,
      });

      showPopup('Markdown converted to DOCX successfully!');
      setUploadedFile(null);
    } catch (err) {
      if (err instanceof AppError) {
        showPopup(`Conversion failed: ${err.message}`);
      } else {
        showPopup('An unexpected error occurred during conversion.');
      }
      console.error("Markdown to DOCX Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <SEO
        title={'Free Markdown to DOCX Converter | MyConverterTool'}
        description={'Convert your Markdown (.md) files to DOCX (Word) documents for free. Fast, secure, and easy to use.'}
        keywords={'markdown to docx, md to docx, convert markdown, markdown converter, free tool'}
      />

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-3xl font-bold text-blue-600 mb-4 text-center"
      >
        Markdown to DOCX Converter
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-center text-gray-500 mb-6"
      >
        Easily convert your Markdown files to Microsoft Word documents.
      </motion.p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        {!convertedFile && (
          <motion.div
            {...getRootProps()}
            whileHover={{ scale: 1.02 }}
            className={`border-2 border-dashed p-8 text-center cursor-pointer rounded-lg mb-6 transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-blue-300 dark:border-blue-500 hover:border-blue-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {isDragActive ? 'Drop the file here...' : 'Drag & drop a .md file here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only .md or .markdown files are accepted.
            </p>
          </motion.div>
        )}

        {uploadedFile && !convertedFile && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Selected File:</h4>
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="truncate font-medium">{uploadedFile.name}</span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {convertedFile && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Conversion Successful!</h4>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-gray-700 rounded-md border border-green-200 dark:border-green-600">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-500" />
                <span className="truncate font-medium">{convertedFile.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={convertedFile.url}
                  download={convertedFile.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
                <button
                  onClick={handleClearSelection}
                  className="text-red-500 hover:text-red-700"
                  title="Clear"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {!convertedFile && (
          <div className="flex justify-center gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConvert}
              disabled={!uploadedFile || loading}
              className="flex items-center justify-center w-full sm:w-auto gap-2 py-2.5 px-4 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5" />
              {loading ? 'Converting...' : 'Convert to DOCX'}
            </motion.button>
          </div>
        )}

        {loading && (
          <div className="mt-4">
            <ConversionProgressBar message="Converting your Markdown file..." />
          </div>
        )}
      </div>

      {popupMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
        >
          {popupMessage}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MarkdownToDocx;
