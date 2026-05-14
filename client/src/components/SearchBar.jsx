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
      className={`glass-card p-1.5 flex items-center gap-3 ${
        isActive ? 'ring-2 ring-blue-500/50 shadow-blue-500/10' : ''
      }`}
    >
      <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3 pl-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          placeholder="Search in document..."
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium py-2"
        />
        {searchText && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </form>

      {totalResults > 0 && (
        <div className="flex items-center gap-4 pr-2 border-l border-slate-100 dark:border-slate-800 pl-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {currentResult} <span className="text-slate-300">/</span> {totalResults}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPrevResult}
              disabled={currentResult <= 1}
              className="p-2 rounded-xl glass hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextResult}
              disabled={currentResult >= totalResults}
              className="p-2 rounded-xl glass hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
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