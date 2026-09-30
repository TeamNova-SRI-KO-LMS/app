import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Database, Globe, BellRing } from 'lucide-react';

const SystemSettings = () => {
  const [platformName, setPlatformName] = useState('SRI-KO Foreign Language Training Center');
  const [contactEmail, setContactEmail] = useState('support@sriko-editorial.com');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-xs sm:text-sm text-gray-500">Configure global portal parameters and security rules.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">General Configuration</h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Portal Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Administrative Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Portal Access Controls</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">Allow New User Registrations</div>
              <div className="text-xs text-gray-400">Permit students to sign up publicly on the website.</div>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">Maintenance Mode</div>
              <div className="text-xs text-gray-400">Temporarily disable public access while doing updates.</div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-semibold">{saved && '✓ Settings saved successfully!'}</span>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;
