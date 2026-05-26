const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: String,
  siteDescription: String,
  siteLogo: String,
  siteFavicon: String,
  contactEmail: String,
  contactPhone: String,
  contactAddress: String,
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String
  },
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPass: String,
    fromEmail: String,
    fromName: String
  },
  courseSettings: {
    minDurationWeeks: Number,
    maxDurationWeeks: Number,
    minPrice: Number,
    maxPrice: Number,
    approvalRequired: { type: Boolean, default: true }
  },
  userSettings: {
    allowRegistration: { type: Boolean, default: true },
    verifyEmails: { type: Boolean, default: true },
    maxLoginAttempts: { type: Number, default: 5 }
  },
  paymentSettings: {
    currency: { type: String, default: 'LKR' },
    stripePublicKey: String,
    stripeSecretKey: String,
    paypalClientId: String,
    paypalSecret: String,
    enablePayments: { type: Boolean, default: true }
  },
  notificationSettings: {
    enableEmails: { type: Boolean, default: true },
    enablePush: { type: Boolean, default: true },
    enableSms: { type: Boolean, default: false },
    digestFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'never'],
      default: 'daily'
    }
  },
  securitySettings: {
    require2FA: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    sessionTimeoutMins: { type: Number, default: 120 },
    accountLockoutMins: { type: Number, default: 15 }
  },
  maintenanceSettings: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String,
    scheduledMaintenance: Date
  },
  analyticsSettings: {
    googleAnalyticsId: String,
    facebookPixelId: String,
    enableTracking: { type: Boolean, default: true }
  },
  uploadSettings: {
    maxImageSizeMB: { type: Number, default: 5 },
    maxVideoSizeMB: { type: Number, default: 500 },
    maxDocSizeMB: { type: Number, default: 10 },
    allowedImageTypes: [String],
    allowedVideoTypes: [String],
    allowedDocTypes: [String]
  },
  themeSettings: {
    primaryColor: String,
    secondaryColor: String,
    darkMode: { type: Boolean, default: false },
    customCss: String
  },
  languageSettings: {
    defaultLanguage: { type: String, default: 'en' },
    supportedLanguages: [String],
    enableRtl: { type: Boolean, default: false }
  },
  backupSettings: {
    autoBackup: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    retentionDays: { type: Number, default: 30 }
  },
  systemSettings: {
    timezone: { type: String, default: 'Asia/Colombo' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    timeFormat: { type: String, default: 'HH:mm' },
    debugMode: { type: Boolean, default: false },
    logLevel: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
