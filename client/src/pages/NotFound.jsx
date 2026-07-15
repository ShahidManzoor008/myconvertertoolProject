import { Link } from 'react-router-dom';
import SEO from '../utils/SEO.jsx';

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pb-24">
    <SEO
      title="Page Not Found - MyConverterTool"
      description="The page you requested could not be found on MyConverterTool."
      robots="noindex, follow"
    />
    <div className="text-8xl md:text-9xl font-black text-blue-600 mb-6">404</div>
    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Page Not Found</h1>
    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-8">The page may have moved, the link may be outdated, or the address may be typed incorrectly.</p>
    <div className="flex flex-col sm:flex-row gap-4">
      <Link to="/" className="btn-primary px-8 py-3">Go Home</Link>
      <Link to="/tools" className="px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">Browse Tools</Link>
    </div>
  </div>
);

export default NotFound;
