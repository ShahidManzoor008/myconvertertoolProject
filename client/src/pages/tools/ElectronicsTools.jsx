import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  CircuitBoard, 
  Calculator, 
  Radio, 
  Gauge, 
  Cpu, 
  Battery, 
  WaveformSquare 
} from 'lucide-react';
import SEO from '../../utils/SEO';
import PropTypes from 'prop-types';

const ToolCard = ({ title, description, icon: Icon, comingSoon, formula }) => (
    <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
      comingSoon ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
    }`}
  >
    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900">
      <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
    </div>
    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
    {formula && (
      <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
        <code className="text-sm text-purple-600 dark:text-purple-400">{formula}</code>
      </div>
    )}
    {comingSoon && (
      <span className="inline-block mt-4 px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
        Coming Soon
      </span>
    )}
  </motion.div>
);

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  comingSoon: PropTypes.bool,
  formula: PropTypes.string
};

const ElectronicsTools = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const tools = [
    {
      title: 'Ohm\'s Law Calculator',
      description: 'Calculate voltage, current, resistance, and power in electrical circuits.',
      icon: Zap,
      formula: 'V = I × R, P = V × I',
      link: '/tools/electronics/ohms-law',
      comingSoon: true
    },
    {
      title: 'RC Circuit Calculator',
      description: 'Calculate time constants and responses for RC circuits.',
      icon: CircuitBoard,
      formula: 'τ = R × C',
      link: '/tools/electronics/rc-circuit',
      comingSoon: true
    },
    {
      title: 'LED Resistor Calculator',
      description: 'Calculate the required resistor value for LED circuits.',
      icon: Calculator,
      formula: 'R = (Vs - Vf) / If',
      link: '/tools/electronics/led-resistor',
      comingSoon: true
    },
    {
      title: 'Frequency Calculator',
      description: 'Calculate frequency, period, and wavelength.',
      icon: WaveformSquare,
      formula: 'f = 1/T, λ = c/f',
      link: '/tools/electronics/frequency',
      comingSoon: true
    },
    {
      title: 'RF Power Calculator',
      description: 'Convert between dBm, watts, and voltage for RF applications.',
      icon: Radio,
      formula: 'P(dBm) = 10 × log₁₀(P(mW))',
      link: '/tools/electronics/rf-power',
      comingSoon: true
    },
    {
      title: 'Voltage Divider',
      description: 'Calculate voltage division in resistive circuits.',
      icon: Gauge,
      formula: 'Vout = Vin × (R2 / (R1 + R2))',
      link: '/tools/electronics/voltage-divider',
      comingSoon: true
    },
    {
      title: 'Logic Gate Simulator',
      description: 'Simulate and analyze digital logic circuits.',
      icon: Cpu,
      link: '/tools/electronics/logic-gates',
      comingSoon: true
    },
    {
      title: 'Battery Life Calculator',
      description: 'Calculate battery life based on capacity and current draw.',
      icon: Battery,
      formula: 'Time(h) = Capacity(mAh) / Current(mA)',
      link: '/tools/electronics/battery-life',
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
          title: 'Free Electronics & Electrical Engineering Tools Online',
          description: 'Access free electronics tools for calculations, circuit analysis, and design. Perfect for engineers, hobbyists, and students.',
          keywords: 'electronics tools, ohms law calculator, circuit calculator, LED calculator, RF calculator, voltage divider, logic gate simulator',
          canonicalUrl: '/tools/electronics',
          ogType: 'website',
          ogTitle: 'Free Electronics Tools - MyConverterTool',
          ogDescription: 'Essential tools for electronics and electrical engineering',
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
          Electronics Tools
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-gray-400"
        >
          Essential calculators and tools for electronics and electrical engineering
        </motion.p>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search electronics tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

export default ElectronicsTools;
