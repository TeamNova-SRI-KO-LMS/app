import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import apiUrl, { getWorkingApiUrl } from '../config/apiConfig';
import {
  CogIcon,
  GlobeAltIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BellIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  PaintBrushIcon,
  LanguageIcon,
  ServerIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('site');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const workingApiUrl = await getWorkingApiUrl();
      const response = await fetch(`${workingApiUrl}/admin/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        } else {
          toast.error(data.message || 'Failed to load settings');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const workingApiUrl = await getWorkingApiUrl();
      
      const response = await fetch(`${workingApiUrl}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
          setHasChanges(false);
          toast.success('Settings saved successfully!');
        } else {
          toast.error(data.message || 'Failed to save settings');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      try {
        setSaving(true);
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const workingApiUrl = await getWorkingApiUrl();
        
        const response = await fetch(`${workingApiUrl}/admin/settings/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings(data.settings);
            setHasChanges(false);
            toast.success('Settings reset to default successfully!');
          } else {
            toast.error(data.message || 'Failed to reset settings');
          }
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to reset settings');
        }
      } catch (error) {
        console.error('Settings reset error:', error);
        toast.error('Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const exportSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const workingApiUrl = await getWorkingApiUrl();
      
      const response = await fetch(`${workingApiUrl}/admin/settings/export/json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.settings, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Settings exported successfully!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export settings');
    }
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
          const workingApiUrl = await getWorkingApiUrl();
          
          const response = await fetch(`${workingApiUrl}/admin/settings/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ settings: importedSettings }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setSettings(data.settings);
              setHasChanges(false);
              toast.success('Settings imported successfully!');
            } else {
              toast.error(data.message || 'Failed to import settings');
            }
          } else {
            const errorData = await response.json();
            toast.error(errorData.message || 'Failed to import settings');
          }
        } catch (error) {
          console.error('Import error:', error);
          toast.error('Invalid settings file');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateSettings = (section, field, value) => {
    // Handle both top-level fields (2 params) and nested fields (3 params)
    if (arguments.length === 2) {
      // Top-level field: updateSettings('fieldName', value)
      const fieldName = section;
      const fieldValue = field;
      setSettings(prev => ({
        ...prev,
        [fieldName]: fieldValue,
      }));
    } else {
      // Nested field: updateSettings('section', 'field', value)
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
    setHasChanges(true);
  };

  const tabs = [
    { id: 'site', name: 'Site Settings', icon: GlobeAltIcon },
    { id: 'course', name: 'Course Settings', icon: UserGroupIcon },
    { id: 'user', name: 'User Settings', icon: UserGroupIcon },
    { id: 'payment', name: 'Payment Settings', icon: CurrencyDollarIcon },
    { id: 'notification', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'maintenance', name: 'Maintenance', icon: WrenchScrewdriverIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'upload', name: 'File Upload', icon: CloudArrowUpIcon },
    { id: 'theme', name: 'Theme', icon: PaintBrushIcon },
    { id: 'language', name: 'Language', icon: LanguageIcon },
    { id: 'backup', name: 'Backup', icon: ServerIcon },
    { id: 'system', name: 'System', icon: CogIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load settings</p>
          <button
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="mt-2 text-gray-600">Manage all LMS configuration settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportSettings}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Export
              </button>
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
              <button
                onClick={resetSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Reset
              </button>
              <button
                onClick={saveSettings}
                disabled={!hasChanges || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckIcon className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Tabs - Fixed */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'site' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Site Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.siteName || ''}
                      onChange={(e) => updateSettings('siteName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => updateSettings('contactEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <textarea
                      value={settings.siteDescription || ''}
                      onChange={(e) => updateSettings('siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mt-8">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <input
                      type="url"
                      value={settings.socialLinks?.facebook || ''}
                      onChange={(e) => updateSettings('socialLinks', 'facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                    <input
                      type="url"
                      value={settings.socialLinks?.twitter || ''}
                      onChange={(e) => updateSettings('socialLinks', 'twitter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="url"
                      value={settings.socialLinks?.instagram || ''}
                      onChange={(e) => updateSettings('socialLinks', 'instagram', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      value={settings.socialLinks?.linkedin || ''}
                      onChange={(e) => updateSettings('socialLinks', 'linkedin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'course' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Course Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Course Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.courseSettings?.maxCourseDuration || 120}
                      onChange={(e) => updateSettings('courseSettings', 'maxCourseDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Course Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.courseSettings?.minCourseDuration || 5}
                      onChange={(e) => updateSettings('courseSettings', 'minCourseDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Course Price ($)</label>
                    <input
                      type="number"
                      value={settings.courseSettings?.maxCoursePrice || 1000}
                      onChange={(e) => updateSettings('courseSettings', 'maxCoursePrice', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Enrolled Students</label>
                    <input
                      type="number"
                      value={settings.courseSettings?.maxEnrolledStudents || 100}
                      onChange={(e) => updateSettings('courseSettings', 'maxEnrolledStudents', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.courseSettings?.allowFreeCourses || false}
                          onChange={(e) => updateSettings('courseSettings', 'allowFreeCourses', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow Free Courses</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.courseSettings?.requireCourseApproval || false}
                          onChange={(e) => updateSettings('courseSettings', 'requireCourseApproval', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Require Course Approval</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'user' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">User Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Session Timeout (hours)</label>
                    <input
                      type="number"
                      value={settings.userSettings?.userSessionTimeout || 24}
                      onChange={(e) => updateSettings('userSettings', 'userSessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Upload Size (MB)</label>
                    <input
                      type="number"
                      value={settings.userSettings?.maxUserUploadSize || 10}
                      onChange={(e) => updateSettings('userSettings', 'maxUserUploadSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.userSettings?.allowRegistration || false}
                          onChange={(e) => updateSettings('userSettings', 'allowRegistration', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow User Registration</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.userSettings?.requireEmailVerification || false}
                          onChange={(e) => updateSettings('userSettings', 'requireEmailVerification', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Require Email Verification</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.userSettings?.allowInstructorRegistration || false}
                          onChange={(e) => updateSettings('userSettings', 'allowInstructorRegistration', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Allow Instructor Registration</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={settings.paymentSettings?.currency || 'LKR'}
                      onChange={(e) => updateSettings('paymentSettings', 'currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee)</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="KRW">KRW</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Public Key</label>
                    <input
                      type="text"
                      value={settings.paymentSettings?.stripePublicKey || ''}
                      onChange={(e) => updateSettings('paymentSettings', 'stripePublicKey', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Secret Key</label>
                    <input
                      type="password"
                      value={settings.paymentSettings?.stripeSecretKey || ''}
                      onChange={(e) => updateSettings('paymentSettings', 'stripeSecretKey', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Client ID</label>
                    <input
                      type="text"
                      value={settings.paymentSettings?.paypalClientId || ''}
                      onChange={(e) => updateSettings('paymentSettings', 'paypalClientId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.paymentSettings?.enablePayments || false}
                        onChange={(e) => updateSettings('paymentSettings', 'enablePayments', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Payment Processing</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                    <input
                      type="number"
                      value={settings.securitySettings?.passwordMinLength || 8}
                      onChange={(e) => updateSettings('securitySettings', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                    <input
                      type="number"
                      value={settings.securitySettings?.sessionTimeout || 24}
                      onChange={(e) => updateSettings('securitySettings', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.securitySettings?.maxLoginAttempts || 5}
                      onChange={(e) => updateSettings('securitySettings', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.securitySettings?.lockoutDuration || 30}
                      onChange={(e) => updateSettings('securitySettings', 'lockoutDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.securitySettings?.enableTwoFactor || false}
                          onChange={(e) => updateSettings('securitySettings', 'enableTwoFactor', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.securitySettings?.passwordRequireSpecialChars || false}
                          onChange={(e) => updateSettings('securitySettings', 'passwordRequireSpecialChars', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Require Special Characters</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Maintenance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceSettings?.maintenanceMode || false}
                        onChange={(e) => updateSettings('maintenanceSettings', 'maintenanceMode', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Maintenance Mode</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Message</label>
                    <textarea
                      value={settings.maintenanceSettings?.maintenanceMessage || ''}
                      onChange={(e) => updateSettings('maintenanceSettings', 'maintenanceMessage', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Start</label>
                    <input
                      type="datetime-local"
                      value={settings.maintenanceSettings?.scheduledMaintenanceStart ? new Date(settings.maintenanceSettings.scheduledMaintenanceStart).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateSettings('maintenanceSettings', 'scheduledMaintenanceStart', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled End</label>
                    <input
                      type="datetime-local"
                      value={settings.maintenanceSettings?.scheduledMaintenanceEnd ? new Date(settings.maintenanceSettings.scheduledMaintenanceEnd).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateSettings('maintenanceSettings', 'scheduledMaintenanceEnd', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.systemSettings?.timezone || 'UTC'}
                      onChange={(e) => updateSettings('systemSettings', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Asia/Seoul">Seoul</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={settings.systemSettings?.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => updateSettings('systemSettings', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                    <select
                      value={settings.systemSettings?.timeFormat || '12'}
                      onChange={(e) => updateSettings('systemSettings', 'timeFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="12">12 Hour</option>
                      <option value="24">24 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                    <select
                      value={settings.systemSettings?.logLevel || 'info'}
                      onChange={(e) => updateSettings('systemSettings', 'logLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.systemSettings?.enableDebugMode || false}
                        onChange={(e) => updateSettings('systemSettings', 'enableDebugMode', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Debug Mode</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Add more tabs as needed */}
            {activeTab === 'notification' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                    <select
                      value={settings.notificationSettings?.notificationFrequency || 'immediate'}
                      onChange={(e) => updateSettings('notificationSettings', 'notificationFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notificationSettings?.emailNotifications || false}
                          onChange={(e) => updateSettings('notificationSettings', 'emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notificationSettings?.pushNotifications || false}
                          onChange={(e) => updateSettings('notificationSettings', 'pushNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notificationSettings?.smsNotifications || false}
                          onChange={(e) => updateSettings('notificationSettings', 'smsNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Theme Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={settings.themeSettings?.primaryColor || '#3B82F6'}
                      onChange={(e) => updateSettings('themeSettings', 'primaryColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <input
                      type="color"
                      value={settings.themeSettings?.secondaryColor || '#8B5CF6'}
                      onChange={(e) => updateSettings('themeSettings', 'secondaryColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                    <input
                      type="color"
                      value={settings.themeSettings?.accentColor || '#10B981'}
                      onChange={(e) => updateSettings('themeSettings', 'accentColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.themeSettings?.darkMode || false}
                        onChange={(e) => updateSettings('themeSettings', 'darkMode', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Dark Mode</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
                    <textarea
                      value={settings.themeSettings?.customCSS || ''}
                      onChange={(e) => updateSettings('themeSettings', 'customCSS', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="/* Custom CSS code */"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional tabs can be added here */}
            {['analytics', 'upload', 'language', 'backup'].includes(activeTab) && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h3>
                <div className="text-center py-12">
                  <CogIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">This section is coming soon!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

