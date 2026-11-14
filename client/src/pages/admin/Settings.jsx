import { Link } from 'react-router-dom';

const Settings = () => (
  <div className="max-w-2xl space-y-5">
    <div>
      <h1 className="font-semibold text-gray-900 dark:text-white">Admin settings</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Website configuration and maintenance.</p>
    </div>
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Website configuration</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Editing the site name, contact email, registration policy, and maintenance mode from this dashboard is not available yet. Configuration changes currently require a server update.</p>
    </section>
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Available maintenance tools</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Review resource usage and safely clear expired analytics records and temporary conversion files.</p>
      <Link to="/admin/analytics#maintenance" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline dark:text-blue-300">Open maintenance tools</Link>
    </section>
  </div>
);

export default Settings;
