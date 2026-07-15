import { useMemo, useState } from "react";
import { ClipboardCopy, Download, Eraser, FileText, RotateCcw } from "lucide-react";
import PropTypes from "prop-types";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { statsApi } from "../../utils/apiClient";

const sampleText = `Paste your draft, article, essay, caption, or product description here. The counter updates instantly with words, characters, sentences, paragraphs, reading time, and keyword frequency.`;

const countSyllables = (word) => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  const groups = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, (groups || []).length - (cleaned.endsWith("e") ? 1 : 0));
};

const analyzeText = (text) => {
  const trimmed = text.trim();
  const words = trimmed.match(/\b[\w'-]+\b/g) || [];
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
  const minutes = words.length / 225;
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  const readingEase = sentences && words.length
    ? Math.round(206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length))
    : 0;

  const stopWords = new Set(["the", "and", "for", "that", "with", "this", "from", "are", "you", "your", "into", "have", "has", "was", "were", "will", "can", "our", "not", "but", "all"]);
  const frequencies = words
    .map((word) => word.toLowerCase().replace(/^'+|'+$/g, ""))
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  const topKeywords = Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return {
    words: words.length,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTime: words.length ? Math.max(1, Math.ceil(minutes)) : 0,
    speakingTime: words.length ? Math.max(1, Math.ceil(words.length / 140)) : 0,
    readingEase,
    topKeywords,
  };
};

const WordCounterTool = () => {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => analyzeText(text), [text]);

  const setAndTrackText = (nextText) => {
    setText(nextText);
    if (nextText.length > 80) {
      statsApi.increment({
        toolName: "word-counter",
        fileSize: nextText.length,
      }).catch((err) => console.error("Failed to log stats:", err));
    }
  };

  const copyReport = async () => {
    const report = [
      `Words: ${stats.words}`,
      `Characters: ${stats.characters}`,
      `Characters without spaces: ${stats.charactersNoSpaces}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Reading time: ${stats.readingTime} min`,
    ].join("\n");

    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadText = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "counted-text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cleanExtraSpaces = () => {
    setAndTrackText(text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
  };

  return (
    <div className="pb-20">
      <SEO
        seoData={{
          title: "Free Word Counter & Character Counter - MyConverterTool",
          description: "Count words, characters, sentences, paragraphs, reading time, speaking time, and keyword frequency with a free online word counter.",
          keywords: "word counter, character counter, sentence counter, paragraph counter, reading time calculator, keyword density",
          canonicalUrl: "/tools/word-counter",
          ogType: "website",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300">
            <FileText size={14} />
            Writing utility
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
            Word & Character Counter
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Analyze drafts, essays, social posts, descriptions, and SEO content with instant counts and readability signals.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Text Workspace</h2>
            <div className="flex flex-wrap gap-2">
              <IconButton onClick={() => setAndTrackText(sampleText)} icon={<FileText size={16} />} label="Sample" />
              <IconButton onClick={cleanExtraSpaces} icon={<Eraser size={16} />} label="Clean" disabled={!text} />
              <IconButton onClick={() => setAndTrackText("")} icon={<RotateCcw size={16} />} label="Reset" disabled={!text} />
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type or paste text to count words, characters, sentences, paragraphs, and reading time..."
            className="min-h-[420px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
          />

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              onClick={copyReport}
              disabled={!text}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200"
            >
              <ClipboardCopy size={16} />
              {copied ? "Copied" : "Copy Report"}
            </button>
            <button
              onClick={downloadText}
              disabled={!text}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} />
              Download Text
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Words" value={stats.words} />
            <StatCard label="Characters" value={stats.characters} />
            <StatCard label="No spaces" value={stats.charactersNoSpaces} />
            <StatCard label="Sentences" value={stats.sentences} />
            <StatCard label="Paragraphs" value={stats.paragraphs} />
            <StatCard label="Read time" value={`${stats.readingTime}m`} />
            <StatCard label="Speak time" value={`${stats.speakingTime}m`} />
            <StatCard label="Readability" value={stats.readingEase || "-"} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">Top Keywords</h2>
            {stats.topKeywords.length ? (
              <div className="space-y-3">
                {stats.topKeywords.map((keyword) => (
                  <div key={keyword.word} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{keyword.word}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {keyword.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">Paste text to see repeated keywords.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-4">
        <ToolSupportSection currentPath="/tools/word-counter" category="Text Tools" />
      </div>
    </div>
  );
};

const IconButton = ({ onClick, icon, label, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
  >
    {icon}
    {label}
  </button>
);

IconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

const StatCard = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default WordCounterTool;
