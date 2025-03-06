import React from "react";
import { Helmet } from "react-helmet-async";
import { FaCode, FaCompressAlt } from "react-icons/fa";
import { BiCodeBlock } from "react-icons/bi";
import { BsQrCode } from "react-icons/bs";
import { SiMarkdown, SiJsonwebtokens } from "react-icons/si";
import { MdOutlinePictureAsPdf } from "react-icons/md";
import { TbTransform } from "react-icons/tb";
import { IoIosConstruct } from "react-icons/io";
import { GiArtificialIntelligence } from "react-icons/gi";

const Tools = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Helmet>
        <title>Free Online Tools | Dev Tools, Text Tools, PDF Tools & More</title>
      </Helmet>

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
        <ToolCard title="PDF Converter" link="/tools/pdf-converter" icon={<MdOutlinePictureAsPdf />} color="bg-red-500" />
      </ToolSection>

      {/* 🌐 SEO Tools */}
      <ToolSection title="🌐 SEO Tools">
        <ToolCard title="QR Code Generator" link="/tools/qr-code-generator" icon={<BsQrCode />} color="bg-teal-500" />
      </ToolSection>

      {/* 🛠 Dev Tools */}
      <ToolSection title="🛠 Dev Tools">
        <ToolCard title="JSON Formatter" link="/tools/json-formatter" icon={<SiJsonwebtokens />} color="bg-indigo-500" />
        <ToolCard title="Base64 Encoder/Decoder" link="/tools/base64-encoder" icon={<BiCodeBlock />} color="bg-purple-500" />
        <ToolCard title="URL Encoder/Decoder" link="/tools/url-encoder" icon={<FaCode />} color="bg-yellow-500" />
        <ToolCard title="Minify & Beautify Code" link="/tools/minify-beautify" icon={<FaCompressAlt />} color="bg-pink-500" />
      </ToolSection>

      {/* 📜 Text Tools */}
      <ToolSection title="📜 Text Tools">
        <ToolCard title="Text Case Converter" link="/tools/text-case-converter" icon={<TbTransform />} color="bg-green-500" />
        <ToolCard title="Markdown to DOCX" link="/tools/markdown-to-docx" icon={<SiMarkdown />} color="bg-blue-500" />
      </ToolSection>

      {/* ⚡ Electronics Tools */}
      <ToolSection title="⚡ Electronics Tools">
        <p className="text-gray-500 mb-4">🚀 No tools yet. Future tools: Resistor calculators, voltage dividers...</p>
        <ToolCard title="Coming Soon" link="/" icon={<IoIosConstruct />} color="bg-gray-400" />
      </ToolSection>

      {/* 🤖 AI Tools */}
      <ToolSection title="🤖 AI Tools">
        <p className="text-gray-500 mb-4">🚀 No tools yet. Future tools: AI text generator, image generator...</p>
        <ToolCard title="AI Tools Coming Soon" link="/" icon={<GiArtificialIntelligence />} color="bg-gray-400" />
      </ToolSection>
    </div>
  );
};

// 🏆 Enhanced Tool Card Component
const ToolCard = ({ title, link, icon, color }) => {
  return (
    <a
      href={link}
      className={`flex items-center justify-between p-5 rounded-lg shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 ${color}`}
    >
      {/* Left: Icon */}
      <div className="text-white text-4xl">{icon}</div>

      {/* Right: Tool Name */}
      <h4 className="text-white font-semibold text-lg text-right w-full">{title}</h4>
    </a>
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

export default Tools;
