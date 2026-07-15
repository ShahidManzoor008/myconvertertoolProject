import { useMemo, useState } from "react";
import { ClipboardCopy, Eye, RotateCcw, Search } from "lucide-react";
import PropTypes from "prop-types";
import SEO from "../../utils/SEO";
import ToolSupportSection from "../../components/ToolSupportSection";
import { statsApi } from "../../utils/apiClient";

const initialState = {
  title: "Free Online PDF, JSON, QR Code & Text Tools",
  description: "Use free online tools to convert PDFs, format JSON, generate QR codes, encode Base64, encode URLs, convert text case, and create DOCX files from Markdown.",
  url: "https://myconvertertool.com/tools",
};

const getStatus = (value, min, max) => {
  const length = value.trim().length;
  if (!length) return { label: "Missing", className: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900" };
  if (length < min) return { label: "Too short", className: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900" };
  if (length > max) return { label: "Too long", className: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900" };
  return { label: "Good", className: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900" };
};

const MetaTagPreview = () => {
  const [form, setForm] = useState(initialState);
  const [copied, setCopied] = useState(false);

  const titleStatus = useMemo(() => getStatus(form.title, 30, 60), [form.title]);
  const descriptionStatus = useMemo(() => getStatus(form.description, 120, 160), [form.description]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (value.length > 30) {
      statsApi.increment({
        toolName: "meta-tag-preview",
        fileSize: value.length,
      }).catch((err) => console.error("Failed to log stats:", err));
    }
  };

  const copyTags = async () => {
    const tags = [
      `<title>${form.title}</title>`,
      `<meta name="description" content="${form.description}">`,
      `<meta property="og:title" content="${form.title}">`,
      `<meta property="og:description" content="${form.description}">`,
      `<meta property="og:url" content="${form.url}">`,
      `<link rel="canonical" href="${form.url}">`,
    ].join("\n");

    await navigator.clipboard.writeText(tags);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="pb-20">
      <SEO
        seoData={{
          title: "Free Meta Tag Preview Tool - SEO Title & Description Checker",
          description: "Preview SEO titles, meta descriptions, canonical URLs, and Open Graph snippets with a free online meta tag preview generator.",
          keywords: "meta tag preview, seo title checker, meta description checker, serp preview, open graph preview",
          canonicalUrl: "/tools/meta-tag-preview",
          ogType: "website",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <Search size={14} />
            SEO utility
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-6xl">
            Meta Tag Preview
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Draft better page titles and descriptions with live length guidance, search preview, and social sharing preview.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Meta Inputs</h2>
            <button
              onClick={() => setForm(initialState)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-amber-500 hover:text-amber-700 dark:border-slate-800 dark:text-slate-300"
            >
              <RotateCcw size={16} />
              Sample
            </button>
          </div>

          <div className="space-y-5">
            <MetaField
              id="meta-title"
              label="SEO title"
              value={form.title}
              status={titleStatus}
              maxLength={70}
              helper="Best range: 30-60 characters."
              onChange={(value) => updateField("title", value)}
            />
            <MetaField
              id="meta-description"
              label="Meta description"
              value={form.description}
              status={descriptionStatus}
              maxLength={180}
              helper="Best range: 120-160 characters."
              textarea
              onChange={(value) => updateField("description", value)}
            />
            <div>
              <label htmlFor="canonical-url" className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">Canonical URL</label>
              <input
                id="canonical-url"
                value={form.url}
                onChange={(event) => updateField("url", event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={copyTags}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            <ClipboardCopy size={16} />
            {copied ? "Copied Tags" : "Copy Meta Tags"}
          </button>
        </section>

        <aside className="space-y-5">
          <PreviewCard title="Google-style Preview" icon={<Eye size={16} />}>
            <div className="font-sans">
              <p className="truncate text-sm text-emerald-700 dark:text-emerald-300">{form.url || "https://example.com/page"}</p>
              <p className="mt-1 line-clamp-2 text-xl text-blue-700 dark:text-blue-300">{form.title || "Page title preview"}</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {form.description || "Meta description preview will appear here as users may see it in search results."}
              </p>
            </div>
          </PreviewCard>

          <PreviewCard title="Open Graph Preview" icon={<Eye size={16} />}>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex h-28 items-center justify-center bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800">
                Social image
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{form.url.replace(/^https?:\/\//, "") || "example.com"}</p>
                <p className="mt-2 line-clamp-2 font-black text-slate-950 dark:text-white">{form.title || "Page title preview"}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{form.description || "Description preview."}</p>
              </div>
            </div>
          </PreviewCard>
        </aside>
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-4">
        <ToolSupportSection currentPath="/tools/meta-tag-preview" category="SEO Tools" />
      </div>
    </div>
  );
};

const MetaField = ({ id, label, value, onChange, status, helper, maxLength, textarea = false }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</label>
      <span className={`rounded-full border px-2 py-1 text-xs font-black ${status.className}`}>
        {value.length}/{maxLength} {status.label}
      </span>
    </div>
    {textarea ? (
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      />
    ) : (
      <input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      />
    )}
    <p className="mt-2 text-xs font-medium text-slate-500">{helper}</p>
  </div>
);

MetaField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  status: PropTypes.shape({
    className: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  helper: PropTypes.string.isRequired,
  maxLength: PropTypes.number.isRequired,
  textarea: PropTypes.bool,
};

const PreviewCard = ({ title, icon, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

PreviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

export default MetaTagPreview;
