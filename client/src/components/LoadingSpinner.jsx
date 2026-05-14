import PropTypes from 'prop-types';

const LoadingSpinner = ({ message, fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      {message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-8 w-full">
      {content}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullPage: PropTypes.bool,
};

export default LoadingSpinner;