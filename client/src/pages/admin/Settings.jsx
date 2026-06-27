

import { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'MyConverterTool',
    contactEmail: 'admin@myconvertertool.com',
    maintenanceMode: false,
    allowRegistration: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Settings saved successfully (simulated)');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="maintenanceMode"
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="rounded text-blue-600"
            />
            <label htmlFor="maintenanceMode" className="text-sm font-medium">Maintenance Mode</label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="allowRegistration"
              id="allowRegistration"
              checked={settings.allowRegistration}
              onChange={handleChange}
              className="rounded text-blue-600"
            />
            <label htmlFor="allowRegistration" className="text-sm font-medium">Allow New User Registration</label>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;