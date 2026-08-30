import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .required(),

  PORT: Joi.number().port().default(4000),

  DATABASE_URL: Joi.string().uri().required(),

  SETTINGS_ENCRYPTION_KEY: Joi.string().length(44).base64().required(),

  AUTH_SESSION_IDLE_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .default(1800),

  AUTH_SESSION_ABSOLUTE_TTL_SECONDS: Joi.number()
    .integer()
    .min(3600)
    .max(2592000)
    .default(86400),

  AUTH_PASSWORD_MIN_LENGTH: Joi.number().integer().min(8).max(64).default(12),

  AUTH_PASSWORD_MAX_LENGTH: Joi.number()
    .integer()
    .min(64)
    .max(1024)
    .default(128),

  AUTH_INVITATION_TTL_SECONDS: Joi.number()
    .integer()
    .min(300)
    .max(604800)
    .default(86400),

  AUTH_LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).max(100).default(5),

  AUTH_LOGIN_WINDOW_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .default(900),

  FILES_STORAGE_PROVIDER: Joi.string()
    .valid('LOCAL', 'AWS_S3')
    .default('LOCAL'),
  FILES_LOCAL_ROOT: Joi.string().default('/opt/odookrd-platform/var/uploads'),
  TRAINING_LOCAL_MEDIA_ROOT: Joi.string().default(
    '/opt/odookrd-platform/var/training-media',
  ),
  FILES_S3_REGION: Joi.when('FILES_STORAGE_PROVIDER', {
    is: 'AWS_S3',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().optional(),
  }),
  FILES_S3_BUCKET: Joi.when('FILES_STORAGE_PROVIDER', {
    is: 'AWS_S3',
    then: Joi.string().min(3).required(),
    otherwise: Joi.string().optional(),
  }),
  FILES_MAX_IMAGE_BYTES: Joi.number()
    .integer()
    .min(1024)
    .max(104857600)
    .default(10485760),
  FILES_MAX_DOCUMENT_BYTES: Joi.number()
    .integer()
    .min(1024)
    .max(104857600)
    .default(52428800),
  FILES_MAX_ATTACHMENT_BYTES: Joi.number()
    .integer()
    .min(1024)
    .max(104857600)
    .default(52428800),
});
