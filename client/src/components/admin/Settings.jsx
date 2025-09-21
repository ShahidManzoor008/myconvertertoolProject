import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave } from 'react-icons/fi';
import PropTypes from 'prop-types';

const SettingsSection = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      footerText: ''
    },
    appearance: {
      theme: 'light',
      primaryColor: '#4F46E5',
      accentColor: '#10B981',
      fontFamily: 'Inter'
    },
    tools: {
      maxFileSize: 10,
      maxConcurrentUploads: 3,
      allowedFileTypes: '.pdf,.doc,.docx,.txt,.jpg,.png',
      enableCloudStorage: false
    },
    analytics: {
      googleAnalyticsId: '',
      enableTracking: true,
      collectDemographics: false,
      collectBehavior: true
    },
    email: {
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/settings');
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/admin/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isSaving}
          className={`px-4 py-2 flex items-center space-x-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <FiSave className="w-5 h-5" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </motion.button>
      </div>

      {savedMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsSection title="General Settings">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site Name
              </label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site Description
              </label>
              <textarea
                value={settings.general.siteDescription}
                onChange={(e) => handleChange('general', 'siteDescription', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.general.contactEmail}
                onChange={(e) => handleChange('general', 'contactEmail', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Appearance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Color
              </label>
              <input
                type="color"
                value={settings.appearance.primaryColor}
                onChange={(e) => handleChange('appearance', 'primaryColor', e.target.value)}
                className="mt-1 block w-full h-10"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Tools Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max File Size (MB)
              </label>
              <input
                type="number"
                value={settings.tools.maxFileSize}
                onChange={(e) => handleChange('tools', 'maxFileSize', parseInt(e.target.value))}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Allowed File Types
              </label>
              <input
                type="text"
                value={settings.tools.allowedFileTypes}
                onChange={(e) => handleChange('tools', 'allowedFileTypes', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.tools.enableCloudStorage}
                onChange={(e) => handleChange('tools', 'enableCloudStorage', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable Cloud Storage
              </label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Email Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.email.smtpHost}
                onChange={(e) => handleChange('email', 'smtpHost', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SMTP Port
              </label>
              <input
                type="text"
                value={settings.email.smtpPort}
                onChange={(e) => handleChange('email', 'smtpPort', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Email
              </label>
              <input
                type="email"
                value={settings.email.fromEmail}
                onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Name
              </label>
              <input
                type="text"
                value={settings.email.fromName}
                onChange={(e) => handleChange('email', 'fromName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Analytics">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Google Analytics ID
              </label>
              <input
                type="text"
                value={settings.analytics.googleAnalyticsId}
                onChange={(e) => handleChange('analytics', 'googleAnalyticsId', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.analytics.enableTracking}
                  onChange={(e) => handleChange('analytics', 'enableTracking', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable Analytics Tracking
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.analytics.collectDemographics}
                  onChange={(e) => handleChange('analytics', 'collectDemographics', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Collect Demographics Data
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.analytics.collectBehavior}
                  onChange={(e) => handleChange('analytics', 'collectBehavior', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Collect Behavior Data
                </label>
              </div>
            </div>
          </div>
        </SettingsSection>
      </form>
    </div>
  );
};

SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Settings;