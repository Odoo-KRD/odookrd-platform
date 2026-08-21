export type SettingCategory =
  | 'general'
  | 'theme'
  | 'companies'
  | 'notifications'
  | 'helpdesk'
  | 'trainings';

export type SettingValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SECRET';
export type SettingPrimitive = string | number | boolean;

export interface SettingDefinition {
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  defaultValue: SettingPrimitive;
  companyVisible: boolean;
  companyOverridable: boolean;
  companyWritable: boolean;
  allowEmpty?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: readonly SettingPrimitive[];
}

export const SETTINGS_REGISTRY: readonly SettingDefinition[] = [
  {
    key: 'general.site_title',
    category: 'general',
    valueType: 'STRING',
    defaultValue: 'OdooKRD',
    companyVisible: true,
    companyOverridable: false,
    companyWritable: false,
    allowEmpty: false,
    maxLength: 150,
  },
  {
    key: 'general.default_locale',
    category: 'general',
    valueType: 'STRING',
    defaultValue: 'ku',
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
    allowedValues: ['ku', 'ar', 'en'],
  },
  {
    key: 'general.timezone',
    category: 'general',
    valueType: 'STRING',
    defaultValue: 'Asia/Baghdad',
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
    allowEmpty: false,
    maxLength: 100,
  },
  {
    key: 'theme.default_font',
    category: 'theme',
    valueType: 'STRING',
    defaultValue: 'Noto Kufi Arabic',
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
    allowEmpty: false,
    maxLength: 150,
    allowedValues: [
      'Noto Kufi Arabic',
      'Noto Sans Arabic',
      'Arial',
      'system-ui',
    ],
  },
  {
    key: 'companies.max_users_per_company',
    category: 'companies',
    valueType: 'NUMBER',
    defaultValue: 25,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: false,
    min: 1,
    max: 100000,
  },
  {
    key: 'notifications.in_app.enabled',
    category: 'notifications',
    valueType: 'BOOLEAN',
    defaultValue: true,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
  },
  {
    key: 'notifications.email.enabled',
    category: 'notifications',
    valueType: 'BOOLEAN',
    defaultValue: false,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
  },
  {
    key: 'notifications.email.provider',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: 'amazon_ses',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    allowedValues: ['amazon_ses'],
  },
  {
    key: 'notifications.email.amazon_ses.region',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 50,
  },
  {
    key: 'notifications.email.amazon_ses.access_key_id',
    category: 'notifications',
    valueType: 'SECRET',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 256,
  },
  {
    key: 'notifications.email.amazon_ses.secret_access_key',
    category: 'notifications',
    valueType: 'SECRET',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 1024,
  },
  {
    key: 'notifications.email.amazon_ses.session_token',
    category: 'notifications',
    valueType: 'SECRET',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 8192,
  },
  {
    key: 'notifications.email.sender_email',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 320,
  },
  {
    key: 'notifications.email.sender_name',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: 'OdooKRD',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 150,
  },
  {
    key: 'notifications.email.reply_to',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 320,
  },
  {
    key: 'notifications.whatsapp.enabled',
    category: 'notifications',
    valueType: 'BOOLEAN',
    defaultValue: false,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: true,
  },
  {
    key: 'notifications.whatsapp.api_url',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 2048,
  },
  {
    key: 'notifications.whatsapp.phone_number_id',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 150,
  },
  {
    key: 'notifications.whatsapp.business_account_id',
    category: 'notifications',
    valueType: 'STRING',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 150,
  },
  {
    key: 'notifications.whatsapp.access_token',
    category: 'notifications',
    valueType: 'SECRET',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 8192,
  },
  {
    key: 'notifications.whatsapp.webhook_verify_token',
    category: 'notifications',
    valueType: 'SECRET',
    defaultValue: '',
    companyVisible: false,
    companyOverridable: false,
    companyWritable: false,
    maxLength: 1024,
  },
  {
    key: 'helpdesk.enabled',
    category: 'helpdesk',
    valueType: 'BOOLEAN',
    defaultValue: false,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: false,
  },
  {
    key: 'trainings.enabled',
    category: 'trainings',
    valueType: 'BOOLEAN',
    defaultValue: false,
    companyVisible: true,
    companyOverridable: true,
    companyWritable: false,
  },
];

export const SETTINGS_BY_KEY = new Map(
  SETTINGS_REGISTRY.map((definition) => [definition.key, definition]),
);

if (SETTINGS_BY_KEY.size !== SETTINGS_REGISTRY.length) {
  throw new Error('Settings registry contains duplicate setting keys.');
}
