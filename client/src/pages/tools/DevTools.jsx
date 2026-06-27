import CategoryToolPage from "../../components/CategoryToolPage";

const DevTools = () => {
  return (
    <CategoryToolPage
      seoData={{
        title: "Free Developer Tools | JSON Formatter, Base64, URL Encoder - MyConverterTool",
        description: "Use free developer tools for JSON formatting, Base64 encoding, URL encoding, and code minifying or beautifying.",
        keywords: "developer tools, json formatter, base64 encoder, url encoder, code minifier, code beautifier",
        canonicalUrl: "/tools/dev",
        ogType: "website",
      }}
      badge="Engineering Suite"
      badgeClassName="bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20"
      icon="terminal"
      title="Developer"
      accent="Utilities"
      description="Free utilities for formatting data, encoding text, and preparing code for everyday development work."
      category="Dev Tools"
    />
  );
};

export default DevTools;
