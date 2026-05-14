import { motion } from 'framer-motion';

const OperationSelection = ({ onSelectOperation }) => {
  const operations = [
    {
      key: 'convert',
      title: 'Convert to PDF',
      desc: 'Convert DOCX, XLSX, Images, Markdown to PDF'
    },
    {
      key: 'edit',
      title: 'Edit PDF',
      desc: 'Split, rotate, delete pages from a PDF'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {operations.map(card => (
        <motion.div
          key={card.key}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelectOperation(card.key)}
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{card.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{card.desc}</p>
          <div className="mt-4 text-xs text-blue-500">Click to select</div>
        </motion.div>
      ))}
    </div>
  );
};

export default OperationSelection;