import CategoryToolPage from "../../components/CategoryToolPage";

const SeoTools = () => {
  return (
    <CategoryToolPage
      seoData={{
        title: "Free SEO & Marketing Tools | QR Code Generator - MyConverterTool",
        description: "Use free SEO and marketing tools to create QR codes and prepare assets for campaigns, sharing, and search workflows.",
        keywords: "seo tools, marketing tools, qr code generator, free qr generator, campaign tools",
        canonicalUrl: "/tools/seo",
        ogType: "website",
      }}
      badge="Growth Suite"
      badgeClassName="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      icon="public"
      title="SEO"
      accent="Utilities"
      description="Marketing tools for creating shareable assets and supporting search-focused workflows."
      category="SEO Tools"
    />
  );
};

export default SeoTools;
