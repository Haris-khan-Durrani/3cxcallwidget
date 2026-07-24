const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Set to true to see SQL queries
  }
);

const Widget = sequelize.define('Widget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fqdn_3cx: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Legacy field — kept for backward compat, no longer used in new widgets
  access_key_3cx: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  agent_extension_3cx: {
    type: DataTypes.STRING,
    allowNull: true,   // now optional at create-time; managed via Agents tab
  },
  // OAuth 2.0 credentials (3CX API v2)
  client_id_3cx: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_secret_3cx: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  grant_type_3cx: {
    type: DataTypes.STRING,
    defaultValue: 'client_credentials',
  },
  webhook_url_n8n: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to push data to n8n/GHL after call',
  },
  webhook_initiated: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_answered: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_completed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_failed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_lead: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Visual customization - NOTE: no emoji in SQL defaults (MySQL strict mode incompatibility)
  color_primary:        { type: DataTypes.STRING, defaultValue: '#0b4526' },
  color_button_text:    { type: DataTypes.STRING, defaultValue: '#ffffff' },
  widget_title:         { type: DataTypes.STRING, defaultValue: 'Need Expert Business Setup Advice?' },
  widget_subtitle:      { type: DataTypes.STRING, defaultValue: 'We will call you in 55 seconds!' },
  widget_button_text:   { type: DataTypes.STRING, defaultValue: 'Call me!' },
  widget_success_title: { type: DataTypes.STRING, defaultValue: 'Calling you now...' },
  widget_success_msg:   { type: DataTypes.STRING, defaultValue: 'Please keep your phone nearby. An agent is connecting.' },
  tooltip_text:         { type: DataTypes.STRING, defaultValue: 'Click here and we will call you within 55 seconds!' },
  country_code:         { type: DataTypes.STRING, defaultValue: '+971' },
  country_flag:         { type: DataTypes.STRING, defaultValue: 'AE' },
  require_email:        { type: DataTypes.BOOLEAN, defaultValue: true },
  require_lastname:     { type: DataTypes.BOOLEAN, defaultValue: true },
  logo_url:             { type: DataTypes.STRING, allowNull: true },
  position:             { type: DataTypes.STRING, defaultValue: 'bottom-right' },
  popup_style:          { type: DataTypes.STRING, defaultValue: 'corner' },
  border_radius:        { type: DataTypes.INTEGER, defaultValue: 16 },
  btn_size:             { type: DataTypes.INTEGER, defaultValue: 60 },
  font_family:          { type: DataTypes.STRING, defaultValue: 'Inter' },
  show_agent:           { type: DataTypes.BOOLEAN, defaultValue: true },
  avatar_shape:         { type: DataTypes.STRING, defaultValue: 'circle' },
  avatar_border_color:  { type: DataTypes.STRING, defaultValue: '#0b4526' },
  agent_status_text:    { type: DataTypes.STRING, defaultValue: 'Will answer your call' },
  fields_order:         { type: DataTypes.STRING, defaultValue: 'first_name,last_name,email,phone' },
  animation_style:      { type: DataTypes.STRING, defaultValue: 'pulse' },
  tooltip_style:        { type: DataTypes.STRING, defaultValue: 'classic' },
  overlay_blur:         { type: DataTypes.INTEGER, defaultValue: 3 },
  custom_css:           { type: DataTypes.TEXT, allowNull: true },
  show_branding:        { type: DataTypes.BOOLEAN, defaultValue: true },
  branding_text:        { type: DataTypes.STRING, defaultValue: 'Powered by 3CX Widget' },
  branding_url:         { type: DataTypes.STRING, defaultValue: 'https://3cx.com' },
  theme_style:          { type: DataTypes.STRING, defaultValue: 'classic' },
  agent_bg_url:         { type: DataTypes.STRING, allowNull: true },
  widget_width:         { type: DataTypes.INTEGER, defaultValue: 345 },
  widget_height:        { type: DataTypes.INTEGER, allowNull: true },
  logo_height:          { type: DataTypes.INTEGER, defaultValue: 36 },
  logo_width:           { type: DataTypes.INTEGER, defaultValue: 140 },
  // HTML entities used instead of raw emojis to prevent MySQL strict mode default value errors
  icon_success_html:    { type: DataTypes.TEXT, defaultValue: '&#x2705;' },
  icon_failed_html:     { type: DataTypes.TEXT, defaultValue: '&#x274C;' },
  icon_success_style:   { type: DataTypes.STRING, defaultValue: 'color: __PRIMARY__; font-size: 52px; display: block; margin-bottom: 10px;' },
  icon_failed_style:    { type: DataTypes.STRING, defaultValue: 'color: #ef4444; font-size: 52px; display: block; margin-bottom: 10px;' },
  // Office hours configuration
  office_hours_enabled:  { type: DataTypes.BOOLEAN, defaultValue: false },
  office_hours_start:    { type: DataTypes.STRING, defaultValue: '09:00' },
  office_hours_end:      { type: DataTypes.STRING, defaultValue: '18:00' },
  office_hours_timezone: { type: DataTypes.STRING, defaultValue: 'Asia/Dubai' },
  office_hours_days:     { type: DataTypes.STRING, defaultValue: '1,2,3,4,5' }, // Mon-Fri
  office_hours_out_title:{ type: DataTypes.STRING, defaultValue: 'Office Closed' },
  office_hours_out_subtitle:{ type: DataTypes.STRING, defaultValue: 'We are currently offline. Please leave your details below and we will contact you during business hours!' },
  office_hours_out_msg:  { type: DataTypes.STRING, defaultValue: 'We have received your inquiry. You will be contacted shortly during business hours!' },
  office_hours_out_status:{ type: DataTypes.STRING, defaultValue: "We're Offline" },
  office_hours_out_sub:  { type: DataTypes.STRING, defaultValue: "Leave a message and we'll reply during business hours!" },
  ring_timeout_seconds:  { type: DataTypes.INTEGER, defaultValue: 40 },
  agent_rotation_enabled:{ type: DataTypes.BOOLEAN, defaultValue: true },
  tooltip_autohide:      { type: DataTypes.BOOLEAN, defaultValue: true },
  tooltip_autohide_seconds: { type: DataTypes.INTEGER, defaultValue: 15 },
  location_id:           { type: DataTypes.STRING, allowNull: true },
  // Tenant Quotas & Limits
  max_concurrent_calls: { type: DataTypes.INTEGER, defaultValue: 5 },
  monthly_call_minutes: { type: DataTypes.INTEGER, defaultValue: 1000 },
  max_campaigns:        { type: DataTypes.INTEGER, defaultValue: 10 },
});

const CallRecord = sequelize.define('CallRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ── Lifecycle fields ──────────────────────────────────────────────────
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Initiated',
    // Values: Initiated | Ringing | Answered | Completed | Missed | Abandoned | Failed
  },
  outcome: {
    type: DataTypes.STRING,
    allowNull: true,
    // Answered | Missed | Abandoned | Failed — the final human-readable result
  },
  agent_extension: {
    type: DataTypes.STRING,
    allowNull: true,   // which agent extension handled this call
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,   // talk time in seconds (null until call ends)
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,   // how many times we retried with another agent
  },
  cx_call_id: {
    type: DataTypes.STRING,
    allowNull: true,   // 3CX call ID returned by makecall (for polling)
  },
  recording_id: {
    type: DataTypes.STRING,
    allowNull: true,   // 3CX recording ID (e.g. 66804) for downloads
  },
  recording_token: {
    type: DataTypes.STRING,
    allowNull: true,   // Opaque sharing/listen token (lifetime validity)
  },
  page_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});


const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  crm_agent_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

const DialerWidget = sequelize.define('DialerWidget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fqdn_3cx: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client_id_3cx: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client_secret_3cx: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  webhook_initiated: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_connected: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_completed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhook_failed: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location_id: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

const DialerCallRecord = sequelize.define('DialerCallRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  agent_extension: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Initiated',
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  recording_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recording_token: {
    type: DataTypes.STRING,
    allowNull: true,   // Opaque sharing/listen token (lifetime validity)
  },
  page_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contact_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const DialerAgent = sequelize.define('DialerAgent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  crm_user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location_id: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin', // admin, agent, etc.
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  two_factor_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  two_factor_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  }
});

const AIProject = sequelize.define('AIProject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fqdn_3cx: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

const AIProviderCredential = sequelize.define('AIProviderCredential', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ai_project_id: { type: DataTypes.UUID, allowNull: false },
  provider_type: { type: DataTypes.STRING, allowNull: false }, // 'stt', 'llm', 'tts'
  provider_name: { type: DataTypes.STRING, allowNull: false }, // 'deepgram', 'openrouter', 'cartesia'
  encrypted_api_key: { type: DataTypes.TEXT, allowNull: false },
  encryption_iv: { type: DataTypes.STRING, allowNull: false },
  encryption_auth_tag: { type: DataTypes.STRING, allowNull: false },
  metadata: { type: DataTypes.JSON, allowNull: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const SIPConfiguration = sequelize.define('SIPConfiguration', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ai_project_id: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING, defaultValue: '3cx' },
  server_url: { type: DataTypes.STRING, allowNull: false },
  extension: { type: DataTypes.STRING, allowNull: false },
  encrypted_password: { type: DataTypes.TEXT, allowNull: false },
  encryption_iv: { type: DataTypes.STRING, allowNull: false },
  encryption_auth_tag: { type: DataTypes.STRING, allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const AICallCampaign = sequelize.define('AICallCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ai_project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  system_prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  stt_provider: {
    type: DataTypes.STRING,
    defaultValue: 'deepgram',
  },
  llm_provider: {
    type: DataTypes.STRING,
    defaultValue: 'openrouter',
  },
  llm_model: {
    type: DataTypes.STRING,
    defaultValue: 'google/gemini-2-flash', 
  },
  tts_provider: {
    type: DataTypes.STRING,
    defaultValue: 'cartesia',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en-US',
  },
  voice_settings: {
    type: DataTypes.JSON,
    allowNull: true,
  }
});

const AICallRecord = sequelize.define('AICallRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ai_project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  campaign_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Initiated', 
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  connected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  customer_intent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sentiment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stt_cost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  llm_cost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  tts_cost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  total_cost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  transcript: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  summary: {
    type: DataTypes.TEXT, 
    allowNull: true,
  },
  recording_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sip_call_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  external_call_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  failure_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

// Relationships
Widget.hasMany(CallRecord, { foreignKey: 'widgetId' });
CallRecord.belongsTo(Widget, { foreignKey: 'widgetId' });

Widget.hasMany(Agent, { foreignKey: 'widgetId' });
Agent.belongsTo(Widget, { foreignKey: 'widgetId' });

DialerWidget.hasMany(DialerCallRecord, { foreignKey: 'dialerId', onDelete: 'CASCADE' });
DialerCallRecord.belongsTo(DialerWidget, { foreignKey: 'dialerId' });

DialerWidget.hasMany(DialerAgent, { foreignKey: 'dialerId', onDelete: 'CASCADE' });
DialerAgent.belongsTo(DialerWidget, { foreignKey: 'dialerId' });

AIProject.hasMany(AIProviderCredential, { foreignKey: 'ai_project_id', onDelete: 'CASCADE' });
AIProviderCredential.belongsTo(AIProject, { foreignKey: 'ai_project_id' });

AIProject.hasMany(SIPConfiguration, { foreignKey: 'ai_project_id', onDelete: 'CASCADE' });
SIPConfiguration.belongsTo(AIProject, { foreignKey: 'ai_project_id' });

AIProject.hasMany(AICallCampaign, { foreignKey: 'ai_project_id', onDelete: 'CASCADE' });
AICallCampaign.belongsTo(AIProject, { foreignKey: 'ai_project_id' });

AIProject.hasMany(AICallRecord, { foreignKey: 'ai_project_id', onDelete: 'CASCADE' });
AICallRecord.belongsTo(AIProject, { foreignKey: 'ai_project_id' });

AICallCampaign.hasMany(AICallRecord, { foreignKey: 'campaign_id', onDelete: 'CASCADE' });
AICallRecord.belongsTo(AICallCampaign, { foreignKey: 'campaign_id' });

module.exports = {
  sequelize,
  Widget,
  CallRecord,
  Agent,
  DialerWidget,
  DialerCallRecord,
  DialerAgent,
  User,
  SystemSetting,
  AIProject,
  AIProviderCredential,
  SIPConfiguration,
  AICallCampaign,
  AICallRecord
};
