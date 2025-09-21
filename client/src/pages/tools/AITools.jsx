import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { MessageSquare, Image, FileText, Wand2, BrainCircuit, Code2, Languages } from 'lucide-react';

import SEO from '../../utils/SEO';



const Tooltip = ({ content, children }) => (
  <div className="group relative inline-block">
    {children}
    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-white opacity-0 transition before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-black before:content-[''] group-hover:opacity-100">
      {content}
    </div>
  </div>
);

Tooltip.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

// Removed duplicate and incomplete ToolCard definition



const ToolCard = ({ title, description, icon: Icon, comingSoon }) => {
  const titleId = `tool-title-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
        comingSoon ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
      }`}
      role="article"
      aria-labelledby={titleId}
    >
    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900">
      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
    {comingSoon && (
      <span className="inline-block mt-4 px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
        Coming Soon
      </span>
    )}
  </motion.div>
  );
};

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  comingSoon: PropTypes.bool
};

const AITools = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const tools = [
    {
      title: 'AI Text Generator',
      description: 'Generate creative text content using advanced AI models.',
      icon: MessageSquare,
      link: '/tools/ai/text-generator',
      comingSoon: true
    },
    {
      title: 'AI Image Generator',
      description: 'Create unique images from text descriptions using AI.',
      icon: Image,
      link: '/tools/ai/image-generator',
      comingSoon: true
    },
    {
      title: 'Text Summarizer',
      description: 'Automatically generate concise summaries of long texts.',
      icon: FileText,
      link: '/tools/ai/summarizer',
      comingSoon: true
    },
    {
      title: 'Content Improver',
      description: 'Enhance your writing with AI-powered suggestions.',
      icon: Wand2,
      link: '/tools/ai/content-improver',
      comingSoon: true
    },
    {
      title: 'Code Generator',
      description: 'Generate code snippets using AI assistance.',
      icon: Code2,
      link: '/tools/ai/code-generator',
      comingSoon: true
    },
    {
      title: 'Language Translator',
      description: 'Translate text between multiple languages using AI.',
      icon: Languages,
      link: '/tools/ai/translator',
      comingSoon: true
    },
    {
      title: 'Sentiment Analyzer',
      description: 'Analyze the sentiment and emotions in text.',
      icon: BrainCircuit,
      link: '/tools/ai/sentiment-analyzer',
      comingSoon: true
    }
  ];

  const filteredTools = tools.filter(tool =>
    tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        seoData={{
          title: 'Free AI Tools Online - Text Generation, Image Creation & More',
          description: 'Access free AI-powered tools for text generation, image creation, summarization, and more. Use advanced machine learning models to enhance your content.',
          keywords: 'ai tools, text generator, image generator, ai summarizer, content improver, code generator, language translator, sentiment analyzer',
          canonicalUrl: '/tools/ai',
          ogType: 'website',
          ogTitle: 'Free AI Tools - MyConverterTool',
          ogDescription: 'Powerful AI tools for content creation and analysis',
          ogImage: '/assets/MyConverterTool.png'
        }}
      />

      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          AI Tools
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-gray-400"
        >
          Harness the power of artificial intelligence with our free online tools
        </motion.p>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search AI tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredTools.map((tool, index) => (
          <ToolCard key={index} {...tool} />
        ))}
      </motion.div>
    </div>
  );
};


export default AITools;
