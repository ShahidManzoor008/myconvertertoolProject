import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import routes from '../data/publicRoutes.json';

import { absoluteUrl } from './seoUrls';
const routeMap = new Map(routes.map(route => [route.path, route]));


const SEO = ({ title, description, keywords, jsonLd, canonicalUrl, ogImage, ogTitle, ogDescription, ogType, robots, metadataOnly = false, seoData = {} }) => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const route = routeMap.get(pathname);
  const pageTitle = route?.title || title || seoData.title || 'MyConverterTool';
  const pageDescription = route?.description || description || seoData.description || 'Free online PDF, text and developer utilities.';
  const canonical = absoluteUrl(canonicalUrl || seoData.canonicalUrl || pathname);
  const image = absoluteUrl(ogImage || seoData.ogImage || '/assets/og-default.png');
  const indexing = robots || seoData.robots || (!route && !pathname.startsWith('/blog/') ? 'noindex, follow' : 'index, follow');
  const structuredData = metadataOnly ? null : jsonLd || seoData.jsonLd || (route?.type === 'tool' ? {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: pageTitle.split(' | ')[0], url: canonical,
    description: pageDescription, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    isAccessibleForFree: true, browserRequirements: 'Requires a modern web browser',
  } : null);
  if (metadataOnly && !/^\/(profile|admin)(\/|$)/.test(pathname)) return null;
  return <Helmet>
    <title>{pageTitle}</title>
    <meta name="description" content={pageDescription} />
    {(keywords || seoData.keywords) && <meta name="keywords" content={keywords || seoData.keywords} />}
    <meta name="robots" content={indexing} />
    <link rel="canonical" href={canonical} />
    <meta property="og:site_name" content="MyConverterTool" />
    <meta property="og:type" content={ogType || seoData.ogType || 'website'} />
    <meta property="og:title" content={ogTitle || pageTitle} />
    <meta property="og:description" content={ogDescription || pageDescription} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={image} />
    <meta property="og:image:alt" content={pageTitle} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={ogTitle || pageTitle} />
    <meta name="twitter:description" content={ogDescription || pageDescription} />
    <meta name="twitter:image" content={image} />
    {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>}
  </Helmet>;
};
SEO.propTypes = { title: PropTypes.string, description: PropTypes.string, keywords: PropTypes.string, jsonLd: PropTypes.oneOfType([PropTypes.object, PropTypes.array]), canonicalUrl: PropTypes.string, ogImage: PropTypes.string, ogTitle: PropTypes.string, ogDescription: PropTypes.string, ogType: PropTypes.string, robots: PropTypes.string, seoData: PropTypes.object, metadataOnly: PropTypes.bool };
export default SEO;
