import PropTypes from 'prop-types';
import SEO from '../utils/SEO.jsx';

const TermsOfService = () => {
  const seoData = {
    title: 'Terms of Service - MyConverterTool',
    description: 'Terms for using MyConverterTool online conversion, formatting, and productivity tools.',
    canonicalUrl: '/terms',
    ogType: 'website',
  };

  return (
    <div className="pb-24">
      <SEO seoData={seoData} />
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Terms of Service</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Rules for using MyConverterTool responsibly.</p>
      </section>

      <TermsSection title="Use of the Service">
        <p>MyConverterTool provides online utilities for file conversion, PDF work, text processing, developer formatting, QR generation, and related productivity tasks. You are responsible for the files, text, and data you submit.</p>
      </TermsSection>

      <TermsSection title="Acceptable Use">
        <p>You may not use the service to upload or process illegal content, malware, copyrighted material you are not authorized to use, abusive content, private information without permission, or content that violates applicable laws or platform policies.</p>
      </TermsSection>

      <TermsSection title="No Professional Advice">
        <p>Tools and articles are provided for general productivity and informational purposes. They are not legal, financial, medical, or professional advice.</p>
      </TermsSection>

      <TermsSection title="Availability and Accuracy">
        <p>We work to keep MyConverterTool reliable, but online tools may produce imperfect output or become temporarily unavailable. Review converted files before relying on them.</p>
      </TermsSection>

      <TermsSection title="Advertising">
        <p>The site may display advertising, including Google AdSense ads. Ads must not be clicked to generate artificial revenue, and users must not manipulate ad impressions or clicks.</p>
      </TermsSection>

      <TermsSection title="Contact">
        <p>For questions about these terms, contact <a className="text-blue-600 font-bold" href="mailto:admin@myconvertertool.com">admin@myconvertertool.com</a>.</p>
      </TermsSection>

      <p className="max-w-4xl mx-auto mt-10 text-sm text-slate-500">Last updated: June 27, 2026</p>
    </div>
  );
};

const TermsSection = ({ title, children }) => (
  <section className="max-w-4xl mx-auto mb-10 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 bg-white/70 dark:bg-slate-900/40">
    <h2 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">{title}</h2>
    <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">{children}</div>
  </section>
);

TermsSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default TermsOfService;
