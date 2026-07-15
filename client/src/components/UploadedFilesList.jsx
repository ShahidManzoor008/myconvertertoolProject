import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const UploadedFilesList = ({ files, onRemoveFile }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Uploaded Files:</h4>
      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
        {files.map((file, index) => (
          <li key={index} className="flex items-center justify-between py-1">
            <span className="truncate">{file.name}</span>
            <button
              onClick={() => onRemoveFile(index)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

UploadedFilesList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRemoveFile: PropTypes.func.isRequired,
};

export default UploadedFilesList;
