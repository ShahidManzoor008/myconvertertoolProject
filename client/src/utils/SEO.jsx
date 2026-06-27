import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

/**
 * SEO component
 * Accepts either individual props (title, description, keywords, jsonLd, canonicalUrl, ogImage)
 * or a single `seoData` object with the same keys.
 * It guards against server-side / test environments where window is undefined.
 */
const SEO = (props) => {
  const {
    title,
    description,
    keywords,
    jsonLd,
    canonicalUrl,
    ogImage,
    ogTitle,
    ogDescription,
    seoData
  } = props;

  // Allow passing a single seoData object or individual props
  const finalTitle = title || (seoData && seoData.title) || '';
  const finalDescription = description || (seoData && seoData.description) || '';
  const finalKeywords = keywords || (seoData && seoData.keywords) || '';
  const finalJsonLd = jsonLd || (seoData && seoData.jsonLd) || null;
  const finalOgImage = ogImage || (seoData && seoData.ogImage) || '/assets/MyConverterTool.png';
  const finalOgTitle = ogTitle || (seoData && seoData.ogTitle) || finalTitle;
  const finalOgDescription = ogDescription || (seoData && seoData.ogDescription) || finalDescription;
  const finalCanonical = canonicalUrl || (seoData && seoData.canonicalUrl) || null;

  // SITE_URL: prefer Vite env var VITE_SITE_URL, then a global window override, else a sensible default
  const SITE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL)
    || (typeof window !== 'undefined' && window.__SITE_URL__)
    || 'https://myconvertertool.com';

  // Safely compute canonical URL and current URL. If canonical is relative, prefix with SITE_URL.
  let finalCanonicalAbsolute = null;
  if (finalCanonical) {
    finalCanonicalAbsolute = finalCanonical.startsWith('http') ? finalCanonical : `${SITE_URL.replace(/\/$/, '')}${finalCanonical.startsWith('/') ? finalCanonical : `/${finalCanonical}`}`;
  }

  let currentUrl = null;
  if (typeof window !== 'undefined' && window.location) {
    currentUrl = window.location.href;
  } else if (finalCanonicalAbsolute) {
    currentUrl = finalCanonicalAbsolute;
  }

  // Only include tags when values exist to avoid empty meta tags
  return (
    <Helmet>
      {finalTitle ? <title>{finalTitle}</title> : null}
      {finalDescription ? <meta name="description" content={finalDescription} /> : null}
      {finalKeywords ? <meta name="keywords" content={finalKeywords} /> : null}
      <meta property="og:type" content="website" />
      {finalOgTitle ? <meta property="og:title" content={finalOgTitle} /> : null}
      {finalOgDescription ? <meta property="og:description" content={finalOgDescription} /> : null}
  {currentUrl ? <meta property="og:url" content={currentUrl} /> : null}
  {finalOgImage ? <meta property="og:image" content={finalOgImage.startsWith('http') ? finalOgImage : `${SITE_URL.replace(/\/$/, '')}${finalOgImage.startsWith('/') ? finalOgImage : `/${finalOgImage}`}`} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      {finalOgTitle ? <meta name="twitter:title" content={finalOgTitle} /> : null}
      {finalOgDescription ? <meta name="twitter:description" content={finalOgDescription} /> : null}
      {finalOgImage ? <meta name="twitter:image" content={finalOgImage} /> : null}
      {finalCanonicalAbsolute ? <link rel="canonical" href={finalCanonicalAbsolute} /> : null}
      {finalJsonLd ? (
        <script type="application/ld+json">{JSON.stringify(finalJsonLd)}</script>
      ) : null}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  jsonLd: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  seoData: PropTypes.object,
  canonicalUrl: PropTypes.string,
  ogImage: PropTypes.string,
  ogTitle: PropTypes.string,
  ogDescription: PropTypes.string,
};

export default SEO;
