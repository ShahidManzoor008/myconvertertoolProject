import PropTypes from 'prop-types';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
  running: {
    icon: Loader2,
    color: 'from-blue-600 to-indigo-500',
    text: 'text-blue-600 dark:text-blue-400',
    spin: true,
  },
  complete: {
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    spin: false,
  },
  error: {
    icon: XCircle,
    color: 'from-red-500 to-rose-500',
    text: 'text-red-600 dark:text-red-400',
    spin: false,
  },
};

const ConversionProgressBar = ({ message = 'Processing...', progress, status = 'running', events = [] }) => {
  const isIndeterminate = progress === undefined;
  const config = statusConfig[status] || statusConfig.running;
  const Icon = config.icon;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
      <div className="flex justify-between items-end px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={`h-4 w-4 flex-shrink-0 ${config.text} ${config.spin ? 'animate-spin' : ''}`} />
          <p className={`truncate text-[10px] font-black uppercase tracking-widest ${config.text}`}>{message}</p>
        </div>
        {!isIndeterminate && (
          <p className={`text-[10px] font-black ${config.text}`}>{Math.round(progress)}%</p>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
          initial={{ width: 0 }}
          animate={{ width: isIndeterminate ? '100%' : `${progress}%` }}
          transition={isIndeterminate ? { repeat: Infinity, duration: 1.5, ease: "linear" } : { duration: 0.3 }}
        />
      </div>
      {events.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {events.map((event) => (
            <div key={event.label} className={`flex items-center gap-2 text-[11px] font-bold ${event.active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
              <span className={`h-2 w-2 rounded-full ${event.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <span>{event.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ConversionProgressBar.propTypes = {
  message: PropTypes.string,
  progress: PropTypes.number,
  status: PropTypes.oneOf(['running', 'complete', 'error']),
  events: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    active: PropTypes.bool,
  })),
};

export default ConversionProgressBar;
