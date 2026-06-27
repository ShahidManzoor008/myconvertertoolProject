import PropTypes from "prop-types";
import ToolCard from "./ToolCard";
import { primaryTools } from "../data/tools.jsx";

const defaultFaqs = [
  {
    question: "Is this tool free to use?",
    answer: "Yes. MyConverterTool utilities are free to use directly in your browser.",
  },
  {
    question: "Do I need to create an account?",
    answer: "Most tools work without registration. Some account features may be used for saved history or advanced workflows.",
  },
  {
    question: "Can I use this tool on mobile?",
    answer: "Yes. The tools are designed to work on desktop, tablet, and mobile browsers.",
  },
];

const toolFaqs = {
  "/tools/pdf-converter": [
    {
      question: "What PDF tasks can I do here?",
      answer: "You can convert supported files to PDF and use available PDF operations such as merging, splitting, compressing, and editing where supported.",
    },
    {
      question: "Can I convert images or documents to PDF?",
      answer: "Yes. The converter is designed for common document and image-to-PDF workflows.",
    },
    {
      question: "Are my files kept forever?",
      answer: "Files are processed for the requested task. Avoid uploading documents you do not have permission to process.",
    },
  ],
  "/tools/json-formatter": [
    {
      question: "Can this format invalid JSON?",
      answer: "The formatter can beautify valid JSON and helps identify structure issues when the input cannot be parsed.",
    },
    {
      question: "Who is this useful for?",
      answer: "It is useful for developers, API testers, analysts, and anyone working with JSON responses or configuration files.",
    },
    {
      question: "Can I use it for large JSON files?",
      answer: "For best browser performance, use reasonably sized JSON data. Very large files may depend on your device memory.",
    },
  ],
  "/tools/base64-encoder": [
    {
      question: "What is Base64 used for?",
      answer: "Base64 is commonly used to encode text or binary data for transport in URLs, APIs, emails, and configuration values.",
    },
    {
      question: "Can I decode Base64 here?",
      answer: "Yes. The tool supports both encoding and decoding workflows.",
    },
    {
      question: "Is Base64 encryption?",
      answer: "No. Base64 is encoding, not encryption. Do not treat Base64 output as secure or private by itself.",
    },
  ],
  "/tools/url-encoder": [
    {
      question: "When should I URL encode text?",
      answer: "Use URL encoding when text contains spaces, symbols, query parameters, or special characters that must be safely placed in a URL.",
    },
    {
      question: "Can this decode encoded URLs?",
      answer: "Yes. You can decode URL-encoded strings back into readable text.",
    },
    {
      question: "Does it work with query strings?",
      answer: "Yes. It is useful for query strings, campaign links, API parameters, and encoded snippets.",
    },
  ],
  "/tools/minify-beautify": [
    {
      question: "What code can I minify or beautify?",
      answer: "The tool is intended for common web formats such as HTML, CSS, JavaScript, and JSON.",
    },
    {
      question: "Should I keep a backup before minifying?",
      answer: "Yes. Keep your original source code before using minified output in production.",
    },
    {
      question: "Why beautify code?",
      answer: "Beautifying code makes copied or compressed snippets easier to read, review, and debug.",
    },
  ],
  "/tools/qr-code-generator": [
    {
      question: "What can I turn into a QR code?",
      answer: "You can create QR codes for links, text, campaign URLs, contact details, or other short shareable content.",
    },
    {
      question: "Are QR codes useful for marketing?",
      answer: "Yes. QR codes are useful for print materials, product labels, menus, events, and offline-to-online campaigns.",
    },
    {
      question: "Should I test the QR code before sharing?",
      answer: "Yes. Always scan and verify the QR code before publishing it on printed or public materials.",
    },
  ],
  "/tools/text-case-converter": [
    {
      question: "What case formats are useful for writing?",
      answer: "Uppercase, lowercase, title case, sentence case, and capitalized text are common formats for editing and publishing.",
    },
    {
      question: "Can this help with headings?",
      answer: "Yes. It is useful for quickly converting drafts, headlines, labels, and copied text into the format you need.",
    },
    {
      question: "Does it change my original text file?",
      answer: "No. Paste text into the tool and use the converted output as needed.",
    },
  ],
  "/tools/markdown-to-docx": [
    {
      question: "Why convert Markdown to DOCX?",
      answer: "DOCX is useful when you need to share Markdown drafts with clients, teachers, editors, or teams using word processors.",
    },
    {
      question: "What Markdown content works best?",
      answer: "Headings, paragraphs, lists, links, and basic formatting work best for clean DOCX output.",
    },
    {
      question: "Can I edit the DOCX after conversion?",
      answer: "Yes. The generated DOCX can be opened and edited in compatible word processors.",
    },
  ],
};

const ToolSupportSection = ({ currentPath, category }) => {
  const relatedTools = primaryTools
    .filter((tool) => tool.path !== currentPath && (!category || tool.category === category))
    .slice(0, 4);
  const fallbackRelatedTools = primaryTools.filter((tool) => tool.path !== currentPath).slice(0, 4);
  const faqs = toolFaqs[currentPath] || defaultFaqs;

  return (
    <section className="mt-20 space-y-16">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-6 sm:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Quick answers before you use this tool.</p>
        </div>
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-4">
              <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4">
                <span>{faq.question}</span>
                <span className="material-icons text-base text-slate-400 transition group-open:rotate-180">expand_more</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Related Tools</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Continue with another useful utility.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(relatedTools.length ? relatedTools : fallbackRelatedTools).map((tool) => (
            <ToolCard
              key={tool.path}
              title={tool.name}
              link={tool.path}
              icon={tool.icon}
              color={tool.color}
              description={tool.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

ToolSupportSection.propTypes = {
  currentPath: PropTypes.string.isRequired,
  category: PropTypes.string,
};

export default ToolSupportSection;
