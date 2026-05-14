import { FaCode, FaCompressAlt } from "react-icons/fa";
import { BiCodeBlock } from "react-icons/bi";
import { BsQrCode } from "react-icons/bs";
import { SiMarkdown, SiJsonwebtokens } from "react-icons/si";
import { MdOutlinePictureAsPdf } from "react-icons/md";
import { TbTransform } from "react-icons/tb";

import ToolCard from "../components/ToolCard"; // Import the global ToolCard
import PropTypes from "prop-types";
import SEO from '../utils/SEO.jsx';

const Tools = () => {
  const seoData = {
    title: 'Free Online Tools | Dev Tools, Text Tools, PDF Tools & More - ConverterPro',
    description: 'Access our collection of free online tools including PDF converters, JSON formatters, QR code generators, and text utilities.',
    keywords: 'online tools, developer tools, PDF tools, JSON formatter, QR code generator, text converter',
    canonicalUrl: '/tools',
    ogType: 'website',
  };

  return (
    <div className="pb-20">
      <SEO seoData={seoData} />

      {/* Header */}
      <section className="text-center py-16 md:py-24" data-aos="zoom-in">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
          Utility <span className="gradient-text">Showcase</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A curated collection of professional-grade tools designed to simplify your digital workflow.
        </p>
      </section>

      <div className="container mx-auto px-4 space-y-20">
        {/* 📄 PDF Tools */}
        <ToolSection title="PDF Management" subtitle="Manipulate, convert and secure your PDF documents.">
          <ToolCard title="PDF Converter" link="/tools/pdf-converter" icon={<MdOutlinePictureAsPdf />} color="red" />
        </ToolSection>

        {/* 🛠 Dev Tools */}
        <ToolSection title="Developer Utilities" subtitle="Essential tools for coding, formatting, and data transformation.">
          <ToolCard title="JSON Formatter" link="/tools/json-formatter" icon={<SiJsonwebtokens />} color="indigo" />
          <ToolCard title="Base64 Tool" link="/tools/base64-encoder" icon={<BiCodeBlock />} color="purple" />
          <ToolCard title="URL Tool" link="/tools/url-encoder" icon={<FaCode />} color="yellow" />
          <ToolCard title="Code Optimizer" link="/tools/minify-beautify" icon={<FaCompressAlt />} color="pink" />
        </ToolSection>

        {/* 📜 Text Tools */}
        <ToolSection title="Text Processing" subtitle="Refine, convert and transform text-based content.">
          <ToolCard title="Case Converter" link="/tools/text-case-converter" icon={<TbTransform />} color="green" />
          <ToolCard title="Markdown to DOCX" link="/tools/markdown-to-docx" icon={<SiMarkdown />} color="blue" />
        </ToolSection>

        {/* 🌐 SEO Tools */}
        <ToolSection title="Digital Marketing" subtitle="Optimize your online presence and reach.">
          <ToolCard title="QR Generator" link="/tools/qr-code-generator" icon={<BsQrCode />} color="teal" />
        </ToolSection>
      </div>
    </div>
  );
};

const ToolSection = ({ title, subtitle, children }) => {
  return (
    <section data-aos="fade-up">
      <div className="mb-10 border-l-4 border-blue-600 pl-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
          {title}
        </h2>
        {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
};

ToolSection.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Tools;
