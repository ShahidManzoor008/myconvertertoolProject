import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ConversionProgressBar = ({ message = 'Processing...', progress }) => {
  const isIndeterminate = progress === undefined;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end px-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">{message}</p>
        {!isIndeterminate && (
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400">{Math.round(progress)}%</p>
        )}
      </div>
      <div className="h-2 w-full glass rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: isIndeterminate ? '100%' : `${progress}%` }}
          transition={isIndeterminate ? { repeat: Infinity, duration: 1.5, ease: "linear" } : { duration: 0.3 }}
        />
      </div>
    </div>
  );
};

ConversionProgressBar.propTypes = {
  message: PropTypes.string,
  progress: PropTypes.number,
};

export default ConversionProgressBar;
