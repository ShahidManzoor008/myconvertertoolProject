import PropTypes from 'prop-types';
import SEO from '../utils/SEO.jsx';

const Contact = () => {
  const seoData = {
    title: 'Contact - MyConverterTool',
    description: 'Contact MyConverterTool for support, privacy, copyright, advertising, or general questions.',
    canonicalUrl: '/contact',
    ogType: 'website',
  };

  return (
    <div className="pb-24">
      <SEO seoData={seoData} />
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Contact MyConverterTool</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Questions, support requests, privacy concerns, and content issues can be sent by email.</p>
      </section>

      <section className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 bg-white/70 dark:bg-slate-900/40">
        <div className="grid gap-6">
          <ContactItem label="General Support" value="admin@myconvertertool.com" href="mailto:admin@myconvertertool.com" />
          <ContactItem label="Privacy Requests" value="admin@myconvertertool.com" href="mailto:admin@myconvertertool.com?subject=Privacy%20Request" />
          <ContactItem label="Copyright or Content Concerns" value="admin@myconvertertool.com" href="mailto:admin@myconvertertool.com?subject=Content%20Concern" />
        </div>
        <p className="mt-8 text-sm text-slate-500 leading-relaxed">Please include the page URL, tool name, browser, and a short description when reporting a technical issue.</p>
      </section>
    </div>
  );
};

const ContactItem = ({ label, value, href }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-5 last:border-b-0 last:pb-0">
    <span className="font-bold text-slate-900 dark:text-white">{label}</span>
    <a className="text-blue-600 font-bold break-all" href={href}>{value}</a>
  </div>
);

ContactItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
};

export default Contact;
