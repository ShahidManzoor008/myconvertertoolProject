import { Link } from 'react-router-dom';

const groups = [
  {
    title: 'Tools',
    links: [
      ['All tools', '/tools'],
      ['PDF Converter', '/tools/pdf-converter'],
      ['Excel & PDF', '/tools/excel-pdf'],
      ['File Compressor', '/tools/file-compressor'],
    ],
  },
  {
    title: 'Resources',
    links: [['Blog', '/blog'], ['About us', '/about'], ['Contact', '/contact']],
  },
  {
    title: 'Legal & privacy',
    links: [['Privacy policy', '/privacy-policy'], ['Terms of service', '/terms']],
  },
];

const linkClass = 'inline-flex min-h-11 items-center py-2 text-sm leading-5 text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300';

const Footer = () => (
  <footer className="w-full border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2">
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">C</span>
            <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">MyConverterTool</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
            Free tools to convert, compress, and simplify your everyday work.
          </p>
        </div>
        {groups.map(({ title, links }) => (
          <nav key={title} aria-label={`Footer ${title.toLowerCase()}`}>
            <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-200">{title}</h2>
            <ul>
              {links.map(([label, path]) => (
                <li key={path}><Link className={linkClass} to={path}>{label}</Link></li>
              ))}
              {title === 'Legal & privacy' && (
                <li>
                  <button type="button" className={`${linkClass} text-left`} onClick={() => window.dispatchEvent(new Event('myconvertertool:cookie-settings'))}>
                    Cookie preferences
                  </button>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} MyConverterTool. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
