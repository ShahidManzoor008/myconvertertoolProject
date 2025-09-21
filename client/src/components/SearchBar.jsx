import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import PropTypes from 'prop-types';

const SearchBar = ({ onSearch, onNextResult, onPrevResult, totalResults, currentResult }) => {
  const [searchText, setSearchText] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText);
    }
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder="Search in document..."
            className="w-full pl-8 pr-10 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchText && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
        </div>

        {totalResults > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentResult} of {totalResults}
            </span>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={onPrevResult}
                disabled={currentResult <= 1}
                className={`p-1 rounded ${
                  currentResult <= 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextResult}
                disabled={currentResult >= totalResults}
                className={`p-1 rounded ${
                  currentResult >= totalResults
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onNextResult: PropTypes.func.isRequired,
  onPrevResult: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
  currentResult: PropTypes.number.isRequired,
};

export default SearchBar;