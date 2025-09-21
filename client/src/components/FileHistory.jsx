import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Star,
  History,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const FileList = ({ files, type, onDownload, toggleFavorite, favorites, removeFromHistory }) => (
  <div className="space-y-2">
    {files.map((file) => (
      <motion.div
        key={file.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
      >
        <div className="flex items-center gap-2 flex-1">
          <FileText className="w-5 h-5 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
              {file.filename}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(file.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(file)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            title={favorites.some(f => f.id === file.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`w-4 h-4 ${
                favorites.some(f => f.id === file.id)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-400'
              }`}
            />
          </button>
          <button
            onClick={() => onDownload(file)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Download file"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </button>
          {type === 'recent' && (
            <button
              onClick={() => removeFromHistory(file.id)}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Remove from history"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </motion.div>
    ))}
  </div>
);

FileList.propTypes = {
  files: PropTypes.array.isRequired,
  type: PropTypes.string.isRequired,
  onDownload: PropTypes.func.isRequired,
  toggleFavorite: PropTypes.func.isRequired,
  favorites: PropTypes.array.isRequired,
  removeFromHistory: PropTypes.func.isRequired,
};

const FileHistory = ({ onDownload }) => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);

  useEffect(() => {
    // Load recent files and favorites from localStorage
    const loadedRecent = JSON.parse(localStorage.getItem('recentFiles') || '[]');
    const loadedFavorites = JSON.parse(localStorage.getItem('favoriteFiles') || '[]');
    setRecentFiles(loadedRecent);
    setFavorites(loadedFavorites);
  }, []);

  const toggleFavorite = (file) => {
    const isFavorite = favorites.some(f => f.id === file.id);
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = favorites.filter(f => f.id !== file.id);
    } else {
      updatedFavorites = [...favorites, file];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteFiles', JSON.stringify(updatedFavorites));
  };

  const removeFromHistory = (fileId) => {
    const updatedRecent = recentFiles.filter(f => f.id !== fileId);
    setRecentFiles(updatedRecent);
    localStorage.setItem('recentFiles', JSON.stringify(updatedRecent));

    // Also remove from favorites if present
    const updatedFavorites = favorites.filter(f => f.id !== fileId);
    if (favorites.length !== updatedFavorites.length) {
      setFavorites(updatedFavorites);
      localStorage.setItem('favoriteFiles', JSON.stringify(updatedFavorites));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
      {/* Recent Files Section */}
      <div>
        <button
          onClick={() => setShowRecent(!showRecent)}
          className="flex items-center justify-between w-full p-2 text-left"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">
              Recent Conversions
            </h3>
          </div>
          {showRecent ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {showRecent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-2"
            >
              {recentFiles.length > 0 ? (
                <FileList
                  files={recentFiles}
                  type="recent"
                  onDownload={onDownload}
                  toggleFavorite={toggleFavorite}
                  favorites={favorites}
                  removeFromHistory={removeFromHistory}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                  No recent conversions
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Favorites Section */}
      <div>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className="flex items-center justify-between w-full p-2 text-left"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">
              Favorites
            </h3>
          </div>
          {showFavorites ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-2"
            >
              {favorites.length > 0 ? (
                <FileList
                  files={favorites}
                  type="favorite"
                  onDownload={onDownload}
                  toggleFavorite={toggleFavorite}
                  favorites={favorites}
                  removeFromHistory={removeFromHistory}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
                  No favorite files
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

FileHistory.propTypes = {
  onDownload: PropTypes.func.isRequired,
};

export default FileHistory;