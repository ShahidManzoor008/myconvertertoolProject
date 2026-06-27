import CategoryToolPage from "../../components/CategoryToolPage";

const TextTools = () => {
  return (
    <CategoryToolPage
      seoData={{
        title: "Free Text Tools | Case Converter & Markdown to DOCX - MyConverterTool",
        description: "Use free text tools to convert text case, clean content, and turn Markdown documents into DOCX files.",
        keywords: "text tools, case converter, markdown to docx, text converter, title case, uppercase, lowercase",
        canonicalUrl: "/tools/text",
        ogType: "website",
      }}
      badge="Content Suite"
      badgeClassName="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      icon="edit_note"
      title="Text"
      accent="Utilities"
      description="Simple writing and document tools for transforming text, changing case, and preparing content."
      category="Text Tools"
    />
  );
};

export default TextTools;
