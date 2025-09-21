import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  StickyNote, 
  Highlighter, 
  Type, 
  Eraser,
  Pencil,
  Save,
  List
} from 'lucide-react';

const AnnotationTools = ({ onAnnotate, annotations, onSave, onClear }) => {
  const [activeType, setActiveType] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(false);

  const tools = [
    {
      id: 'highlight',
      name: 'Highlight',
      icon: <Highlighter className="w-4 h-4" />,
      color: 'rgba(255, 255, 0, 0.3)'
    },
    {
      id: 'underline',
      name: 'Underline',
      icon: <Type className="w-4 h-4" />,
      color: '#2196F3'
    },
    {
      id: 'note',
      name: 'Add Note',
      icon: <StickyNote className="w-4 h-4" />,
      color: '#4CAF50'
    },
    {
      id: 'draw',
      name: 'Draw',
      icon: <Pencil className="w-4 h-4" />,
      color: '#FF5722'
    }
  ];

  const handleToolClick = (toolId) => {
    if (activeType === toolId) {
      setActiveType(null);
    } else {
      setActiveType(toolId);
      onAnnotate({ type: toolId });
    }
  };

  const toggleAnnotationsList = () => {
    setShowAnnotations(!showAnnotations);
  };

  return (
    <div className="relative">
      <div className="flex flex-col items-center space-y-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleToolClick(tool.id)}
            className={`p-2 rounded-lg transition-colors ${
              activeType === tool.id
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={tool.name}
          >
            {tool.icon}
          </motion.button>
        ))}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClear}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Clear All"
        >
          <Eraser className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSave}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Save Annotations"
        >
          <Save className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleAnnotationsList}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Show Annotations List"
        >
          <List className="w-4 h-4" />
        </motion.button>
      </div>

      {showAnnotations && annotations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-full ml-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-64"
        >
          <h3 className="font-semibold mb-2">Annotations</h3>
          <div className="space-y-2">
            {annotations.map((annotation, index) => (
              <div
                key={index}
                className="text-sm p-2 rounded bg-gray-50 dark:bg-gray-700"
              >
                <div className="font-medium">{annotation.type}</div>
                <div className="text-gray-500 dark:text-gray-400">
                  Page {annotation.page}
                </div>
                {annotation.text && (
                  <div className="mt-1">{annotation.text}</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

AnnotationTools.propTypes = {
  onAnnotate: PropTypes.func.isRequired,
  annotations: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    page: PropTypes.number.isRequired,
    text: PropTypes.string,
  })).isRequired,
  onSave: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default AnnotationTools;