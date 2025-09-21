import { FaCode, FaCompressAlt } from "react-icons/fa";
import { BiCodeBlock } from "react-icons/bi";
import { BsQrCode } from "react-icons/bs";
import { SiMarkdown, SiJsonwebtokens } from "react-icons/si";
import { MdOutlinePictureAsPdf } from "react-icons/md";
import { TbTransform } from "react-icons/tb";
import { IoIosConstruct } from "react-icons/io";
import { GiArtificialIntelligence } from "react-icons/gi";
import ToolCard from "../components/ToolCard"; // Import the global ToolCard
import PropTypes from "prop-types";
import SEO from '../utils/SEO.jsx';

const Tools = () => {
  const seoData = {
    title: 'Free Online Tools | Dev Tools, Text Tools, PDF Tools & More - MyConverterTool',
    description: 'Access our collection of free online tools including PDF converters, JSON formatters, QR code generators, text tools, and more. Perfect for developers and digital professionals.',
    keywords: 'online tools, developer tools, PDF tools, JSON formatter, QR code generator, text converter, base64 encoder, URL encoder, code beautifier, markdown converter',
    canonicalUrl: '/tools',
    ogType: 'website',
    ogTitle: 'Free Online Developer Tools & Utilities - MyConverterTool',
    ogDescription: 'Powerful collection of free online tools for developers, writers, and digital professionals. Convert, format, encode, and transform your data easily.',
    ogImage: '/assets/MyConverterTool.png',
    structuredData: {
      '@type': 'WebPage',
      name: 'MyConverterTool Online Tools',
      description: 'Collection of free online developer tools and utilities',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <SEO 
        {...seoData}
      />

      {/* 🔥 Improved Showcase Title */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-800 uppercase tracking-wide">
          🛠️ Tools Showcase
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Explore powerful online tools for developers, writers, and more.
        </p>
      </div>

      {/* 📄 PDF Tools */}
      <ToolSection title="📄 PDF Tools">
        <ToolCard title="PDF Converter" link="/tools/pdf-converter" icon={<MdOutlinePictureAsPdf />} color="red" />
      </ToolSection>

      {/* 🌐 SEO Tools */}
      <ToolSection title="🌐 SEO Tools">
        <ToolCard title="QR Code Generator" link="/tools/qr-code-generator" icon={<BsQrCode />} color="teal" />
      </ToolSection>

      {/* 🛠 Dev Tools */}
      <ToolSection title="🛠 Dev Tools">
        <ToolCard title="JSON Formatter" link="/tools/json-formatter" icon={<SiJsonwebtokens />} color="indigo" />
        <ToolCard title="Base64 Encoder/Decoder" link="/tools/base64-encoder" icon={<BiCodeBlock />} color="purple" />
        <ToolCard title="URL Encoder/Decoder" link="/tools/url-encoder" icon={<FaCode />} color="yellow" />
        <ToolCard title="Minify & Beautify Code" link="/tools/minify-beautify" icon={<FaCompressAlt />} color="pink" />
      </ToolSection>

      {/* 📜 Text Tools */}
      <ToolSection title="📜 Text Tools">
        <ToolCard title="Text Case Converter" link="/tools/text-case-converter" icon={<TbTransform />} color="green" />
        <ToolCard title="Markdown to DOCX" link="/tools/markdown-to-docx" icon={<SiMarkdown />} color="blue" />
      </ToolSection>

      {/* ⚡ Electronics Tools */}
      <ToolSection title="⚡ Electronics Tools">
        <p className="text-gray-500 mb-4">🚀 No tools yet. Future tools: Resistor calculators, voltage dividers...</p>
        <ToolCard title="Coming Soon" link="/" icon={<IoIosConstruct />} color="gray" />
      </ToolSection>

      {/* 🤖 AI Tools */}
      <ToolSection title="🤖 AI Tools">
        <p className="text-gray-500 mb-4">🚀 No tools yet. Future tools: AI text generator, image generator...</p>
        <ToolCard title="AI Tools Coming Soon" link="/" icon={<GiArtificialIntelligence />} color="gray" />
      </ToolSection>
    </div>
  );
};

// 🎯 Enhanced Tool Section Component
const ToolSection = ({ title, children }) => {
  return (
    <section className="mb-12">
      {/* Left-Aligned Category Name */}
      <h2 className="text-3xl font-bold mb-6 text-left text-gray-700">{title}</h2>
      
      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
};

ToolSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tools;
